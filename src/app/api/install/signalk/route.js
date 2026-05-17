import { run } from '../../../../lib/exec.js';
import * as fs from 'fs';

const encoder = new TextEncoder();
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
      await writeLog('[1/4] Installing system dependencies...\n');
      await run('apt-get install -y libnss-mdns avahi-utils libavahi-compat-libdnssd-dev libsystemd-dev build-essential python3');

      await writeLog('[2/4] Installing SignalK server globally via npm...\n');
      await run('npm install -g signalk-server');

      await writeLog('[3/4] Configuring SignalK service (port 3001 to avoid conflict)...\n');
      const serviceContent = `[Unit]
Description=SignalK Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/signalk-server --port 3001
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

      await writeLog('[4/4] Enabling SignalK service...\n');
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
