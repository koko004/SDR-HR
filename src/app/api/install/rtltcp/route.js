import { run } from '../../../../lib/exec.js';
import * as fs from 'fs';

const encoder = new TextEncoder();
const RTL_TCP_SERVICE_PATH = '/etc/systemd/system/rtl_tcp.service';

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
      await writeLog('[1/3] Checking rtl_tcp binary...\n');
      const { stdout } = await run('which rtl_tcp');
      if (!stdout.trim()) {
        await writeLog('  rtl_tcp not found. Installing rtl-sdr package...\n');
        await run('apt-get install -y rtl-sdr');
      } else {
        await writeLog('  rtl_tcp already available.\n');
      }

      await writeLog('[2/3] Creating systemd service...\n');
      const serviceContent = `[Unit]
Description=RTL_TCP SDR Server
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/rtl_tcp -a 0.0.0.0
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;
      fs.writeFileSync(RTL_TCP_SERVICE_PATH, serviceContent);
      await run('systemctl daemon-reload');

      await writeLog('[3/3] Enabling rtl_tcp service...\n');
      await run('systemctl enable rtl_tcp');

      await writeLog('\nrtl_tcp installed successfully.\n');
      await writeLog('Access: connect SDR software to port 1234\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
