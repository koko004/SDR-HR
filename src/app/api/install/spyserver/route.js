import { run } from '../../../../lib/exec.js';
import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const exec = promisify(nodeExec);

const SPYSERVER_INSTALL_DIR = '/opt/spyserver';
const SPYSERVER_SERVICE_PATH = '/etc/systemd/system/spyserver.service';

const ARCH_MAP = {
  arm: 'arm32',
  arm64: 'arm64',
  aarch64: 'arm64',
  x64: 'x64',
  x86_64: 'x64',
  i386: 'x86',
  i686: 'x86',
};

const SPYSERVER_URLS = {
  arm32: [
    'https://airspy.com/downloads/spyserver-arm32-rpi.tgz',
    'https://airspy.com/?ddownload=4247',
  ],
  arm64: ['https://airspy.com/?ddownload=4248'],
  x64: ['https://airspy.com/?ddownload=4249'],
  x86: ['https://airspy.com/?ddownload=4249'],
};

async function detectArch() {
  try {
    const { stdout } = await exec('uname -m');
    const raw = stdout.trim();
    if (raw.includes('aarch64') || raw.includes('arm64')) return 'arm64';
    if (raw.includes('arm') || raw.includes('armv7')) return 'arm32';
    if (raw.includes('x86_64')) return 'x64';
    if (raw.includes('i686') || raw.includes('i386')) return 'x86';
  } catch {
    // fallback
  }
  return ARCH_MAP[process.arch] || 'x64';
}

async function getLocalIP() {
  try {
    const { stdout } = await exec("hostname -I | awk '{print $1}'");
    return stdout.trim() || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

export async function POST(req) {
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();

  const write = async (msg) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: msg })}\n\n`));
  };

  (async () => {
    try {
      const arch = await detectArch();
      const localIP = await getLocalIP();
      await write(`[1/6] Detected architecture: ${arch} (${process.arch})\n`);

      const downloadUrls = SPYSERVER_URLS[arch];
      if (!downloadUrls) {
        await write(`ERROR: Unsupported architecture: ${arch}\n`);
        await writer.close();
        return;
      }

      await write(`[2/6] Downloading SpyServer for ${arch}...\n`);

      if (!fs.existsSync(SPYSERVER_INSTALL_DIR)) {
        await run(`mkdir -p ${SPYSERVER_INSTALL_DIR}`);
      }

      const tgzPath = '/tmp/spyserver.tgz';
      let downloaded = false;
      for (const url of downloadUrls) {
        await write(`  Trying: ${url}\n`);
        const result = await run(`curl -fsSL -L -o ${tgzPath} "${url}"`);
        if (result.exitCode === 0 && fs.existsSync(tgzPath)) {
          downloaded = true;
          break;
        }
        await run(`rm -f ${tgzPath}`);
      }
      if (!downloaded) {
        await write('ERROR: Failed to download SpyServer from any source.\n');
        await writer.close();
        return;
      }

      await write('[3/6] Extracting SpyServer...\n');
      await run(`tar -xzf ${tgzPath} -C ${SPYSERVER_INSTALL_DIR} --strip-components=1`);
      await run(`rm -f ${tgzPath}`);
      await run(`chmod +x ${SPYSERVER_INSTALL_DIR}/spyserver`);

      await write('[4/6] Creating spyserver.config (device_type = RTL-SDR)...\n');
      const configPath = path.join(SPYSERVER_INSTALL_DIR, 'spyserver.config');
      const defaultConfig = `device_type = "RTL-SDR"
sample_rate = 2500000
gain = 10
fftw_bits = 20
# bind to all interfaces
bind_host = 0.0.0.0
listen_port = 5555
# allow multiple clients
maximum_clients = 4
# allow clients to change gain
allow_control = true
`;
      fs.writeFileSync(configPath, defaultConfig);

      await write('[5/6] Creating systemd service...\n');
      const serviceContent = `[Unit]
Description=SpyServer RTL-SDR Network Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${SPYSERVER_INSTALL_DIR}
ExecStart=${SPYSERVER_INSTALL_DIR}/spyserver ${SPYSERVER_INSTALL_DIR}/spyserver.config
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
`;
      fs.writeFileSync(SPYSERVER_SERVICE_PATH, serviceContent);
      await run('systemctl daemon-reload');

      await write('[6/6] Enabling SpyServer service...\n');
      await run('systemctl enable spyserver');

      await write(`\nSpyServer installed successfully.\n`);
      await write(`Access: sdrsharp or SDR++ at ${localIP}:5555\n`);
      await write('DONE');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      await write(`\nERROR: ${msg}\n`);
    }
    await writer.close();
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
