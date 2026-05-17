import { run } from '../../../../lib/exec.js';
import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const exec = promisify(nodeExec);
const encoder = new TextEncoder();
const SIGNALK_DIR = '/opt/signalk';
const SIGNALK_SERVICE = '/etc/systemd/system/signalk.service';

async function streamResponse(req, handler) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const write = async (msg) => {
    await writer.write(encoder.encode(msg));
  };

  const writeLog = async (msg) => {
    await write(`data: ${JSON.stringify({ text: msg })}\n\n`);
  };

  handler(writeLog);

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}

export async function POST(req) {
  return streamResponse(req, async (writeLog) => {
    try {
      await writeLog('[1/5] Installing system dependencies...\n');
      await run('apt-get install -y libavahi-compat-libdnssd-dev libsystemd-dev build-essential python3');

      await writeLog('[2/5] Installing Node.js 20.x if needed...\n');
      try {
        const { stdout } = await exec('node --version');
        const version = stdout.trim();
        if (!version.startsWith('v20') && !version.startsWith('v22')) {
          await run('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
          await run('apt-get install -y nodejs');
        } else {
          await writeLog(`  Node.js ${version} already installed.\n`);
        }
      } catch {
        await run('curl -fsSL https://deb.nodesource.com/setup_20.x | bash -');
        await run('apt-get install -y nodejs');
      }

      await writeLog('[3/5] Installing SignalK server via npm...\n');
      if (!fs.existsSync(SIGNALK_DIR)) {
        await run(`mkdir -p ${SIGNALK_DIR}`);
      }
      await run(`cd ${SIGNALK_DIR} && npm install signalk-server`);

      await writeLog('[4/5] Configuring SignalK service (port 3001 to avoid conflict)...\n');
      const serviceContent = `[Unit]
Description=SignalK Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SIGNALK_DIR}
ExecStart=${SIGNALK_DIR}/node_modules/.bin/signalk-server --port 3001
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
`;
      fs.writeFileSync(SIGNALK_SERVICE, serviceContent);
      await run('systemctl daemon-reload');

      await writeLog('[5/5] Enabling SignalK service...\n');
      await run('systemctl enable signalk');

      await writeLog('\nSignalK installed successfully.\n');
      await writeLog('Access: http://<IP>:3001\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
