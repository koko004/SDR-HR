import { run } from '../../../../lib/exec.js';
import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(nodeExec);
const encoder = new TextEncoder();

const SUPPORTED_RELEASES = ['buster', 'bullseye'];

async function detectDebianRelease() {
  try {
    const { stdout } = await exec('grep VERSION_CODENAME /etc/os-release');
    const match = stdout.match(/VERSION_CODENAME=(.+)/);
    if (match) {
      const release = match[1].trim().toLowerCase();
      if (SUPPORTED_RELEASES.includes(release)) return release;
    }
  } catch {
    // ignore
  }
  return 'bullseye';
}

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
      await writeLog('[1/6] Stopping conflicting services...\n');
      await run('systemctl stop spyserver 2>/dev/null; systemctl stop openwebrx 2>/dev/null');
      await writeLog('[2/6] Updating package lists...\n');
      await run('apt-get update -y');
      await writeLog('[3/6] Installing dependencies (rtl-sdr, libsox, etc.)...\n');
      await run('apt-get install -y rtl-sdr libsox-fmt-all sox');

      const release = await detectDebianRelease();
      await writeLog(`[4/6] Detected Debian release: ${release}. Adding OpenWebRX repository...\n`);
      await run('apt-get install -y gnupg wget');
      await run('wget -O /usr/share/keyrings/openwebrx.gpg https://repo.openwebrx.de/openwebrx.gpg');
      await run(`echo "deb [signed-by=/usr/share/keyrings/openwebrx.gpg] https://repo.openwebrx.de/debian/ ${release} main" > /etc/apt/sources.list.d/openwebrx.list`);

      await writeLog('[5/6] Running apt-get update for OpenWebRX repo...\n');
      await run('apt-get update -y');
      await writeLog('[6/6] Installing openwebrx...\n');
      await run('apt-get install -y openwebrx');
      
      await writeLog('[Post-Install] Setting admin password to "admin"...\n');
      await run('openwebrx admin adduser admin admin 2>/dev/null || openwebrx admin reset-password admin admin');

      await writeLog('\nOpenWebRX installed successfully.\n');
      await writeLog('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await writeLog(`\nERROR: ${msg}\n`);
    }
  });
}
