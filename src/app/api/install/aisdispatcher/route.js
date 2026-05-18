import { run } from '../../../../lib/exec.js';
import * as fs from 'fs';

const encoder = new TextEncoder();
const AIS_DISPATCHER_SERVICE = '/etc/systemd/system/aisdispatcher.service';

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
      await writeLog('[1/4] Installing dependency (aha)...\n');
      await run('apt-get install -y aha');

      await writeLog('[2/4] Downloading AIS Dispatcher installer...\n');
      await run('wget -O /tmp/install_dispatcher https://www.aishub.net/downloads/dispatcher/install_dispatcher');
      await run('chmod 755 /tmp/install_dispatcher');

      await writeLog('[3/4] Running AIS Dispatcher installer...\n');
      await run('cd /tmp && ./install_dispatcher -y');

      await writeLog('[4/4] Enabling AIS Dispatcher service bridge...\n');
      // Using the bridge we created earlier
      await run('cp /opt/sdr-hr/ais-dispatcher.service /etc/systemd/system/');
      await run('systemctl daemon-reload');
      await run('systemctl enable ais-dispatcher');
      await run('systemctl start ais-dispatcher');

      await writeLog('\nAIS Dispatcher installed successfully.\n');
      await writeLog('Access: http://<IP>:8080 (default: admin/admin)\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
