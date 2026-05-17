import { NextResponse } from 'next/server';
import { run } from '../../../../lib/exec.js';
import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const exec = promisify(nodeExec);

async function getLocalIP() {
  try {
    const { stdout } = await exec("hostname -I | awk '{print $1}'");
    return stdout.trim() || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

export async function GET() {
  try {
    const ip = await getLocalIP();

    const openwebrxInstalled = await run('dpkg -s openwebrx 2>/dev/null | grep -q "Status: install" && echo yes || echo no');
    const spyserverInstalled = fs.existsSync('/opt/spyserver/spyserver');
    const rtltcpInstalled = await run('which rtl_tcp');
    const aiscatcherInstalled = fs.existsSync('/opt/aiscatcher/dispatcher') || fs.existsSync('/usr/local/bin/dispatcher');
    const signalkInstalled = fs.existsSync('/opt/signalk/node_modules/signalk-server');

    return NextResponse.json({
      openwebrxInstalled: openwebrxInstalled.stdout.trim() === 'yes',
      spyserverInstalled,
      rtltcpInstalled: rtltcpInstalled.stdout.trim().length > 0,
      aiscatcherInstalled,
      signalkInstalled,
      openwebrxUrl: `http://${ip}:8073`,
      spyserverUrl: `${ip}:5555`,
      rtltcpUrl: `${ip}:1234`,
      aiscatcherUrl: `http://${ip}:8080`,
      signalkUrl: `http://${ip}:3001`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
