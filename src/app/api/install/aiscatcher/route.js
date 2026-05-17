import { run } from '../../../../lib/exec.js';
import * as fs from 'fs';

const encoder = new TextEncoder();
const AIS_CATCHER_DIR = '/opt/aiscatcher';
const AIS_CATCHER_SERVICE = '/etc/systemd/system/aiscatcher.service';

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
      await writeLog('[1/4] Downloading AIS Catcher installer...\n');
      if (!fs.existsSync(AIS_CATCHER_DIR)) {
        await run(`mkdir -p ${AIS_CATCHER_DIR}`);
      }

      await run('wget -O /tmp/install_dispatcher https://www.aishub.net/downloads/dispatcher/install_dispatcher');
      await run('chmod 755 /tmp/install_dispatcher');

      await writeLog('[2/4] Running AIS Catcher installer...\n');
      await run('cd /tmp && ./install_dispatcher -y');

      await writeLog('[3/4] Configuring AIS Catcher service...\n');
      const serviceContent = `[Unit]
Description=AIS Catcher Dispatcher
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${AIS_CATCHER_DIR}
ExecStart=${AIS_CATCHER_DIR}/dispatcher
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;
      fs.writeFileSync(AIS_CATCHER_SERVICE, serviceContent);
      await run('systemctl daemon-reload');

      await writeLog('[4/4] Enabling AIS Catcher service...\n');
      await run('systemctl enable aiscatcher');

      await writeLog('\nAIS Catcher installed successfully.\n');
      await writeLog('Access: http://<IP>:8080 (default: admin/admin)\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
