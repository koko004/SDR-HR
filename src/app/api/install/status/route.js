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
    const spyserverInstalled = fs.existsSync('/etc/systemd/system/spyserver.service');
    const rtltcpInstalled = fs.existsSync('/etc/systemd/system/rtl_tcp.service');
    const aisdispatcherInstalled = fs.existsSync('/etc/systemd/system/ais-dispatcher.service');
    const aiscatcherInstalled = fs.existsSync('/etc/systemd/system/ais-catcher.service');
    const signalkInstalled = fs.existsSync('/etc/systemd/system/signalk.service');

    return NextResponse.json({
      openwebrxInstalled: openwebrxInstalled.stdout.trim() === 'yes',
      spyserverInstalled,
      rtltcpInstalled,
      aisdispatcherInstalled,
      aiscatcherInstalled,
      signalkInstalled,
      openwebrxUrl: `http://${ip}:8073`,
      spyserverUrl: `${ip}:5555`,
      rtltcpUrl: `${ip}:1234`,
      aisdispatcherUrl: `http://${ip}:8080`,
      aiscatcherUrl: `http://${ip}:8100`,
      signalkUrl: `http://${ip}:3001`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
