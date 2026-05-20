import { run } from '../../../../lib/exec.js';

const encoder = new TextEncoder();

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
      await writeLog('[1/2] Disabling old aiscatcher service if present...\n');
      await run('systemctl disable aiscatcher.service 2>/dev/null');

      await writeLog('[2/2] Installing AIS Catcher via official script...\n');
      await run('bash -c "$(curl -fsSL https://raw.githubusercontent.com/jvde-github/AIS-catcher/main/scripts/aiscatcher-install) -p"');
      
      await writeLog('[3/3] Configuring AIS Catcher service for web access...\n');
      // Update the config file to enable web server
      await run('sed -i \'s/"active":false/"active":true/\' /etc/AIS-catcher/config.json');
      // Update the systemd service to include the required flags for port 8102
      await run("sed -i 's|ExecStart=/usr/bin/AIS-catcher.*|ExecStart=/usr/bin/AIS-catcher -N 8102 share_loc on -X -gr -G system on -o 0 -C /etc/AIS-catcher/config.json @/etc/AIS-catcher/config.cmd|' /etc/systemd/system/ais-catcher.service");
      await run('systemctl daemon-reload');
      await run('systemctl restart ais-catcher.service');

      await writeLog('\nAIS Catcher installed and configured successfully.\n');
      await writeLog('Access: http://<IP>:8100\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
