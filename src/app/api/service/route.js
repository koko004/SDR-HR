import { NextResponse } from 'next/server';
import { run } from '../../../lib/exec.js';
import * as fs from 'fs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { mode } = body;

    const validModes = ['openwebrx', 'spyserver', 'rtltcp', 'aiscatcher', 'signalk', 'off'];
    if (!validModes.includes(mode)) {
      return NextResponse.json(
        { error: `Invalid mode. Use: ${validModes.join(', ')}` },
        { status: 400 }
      );
    }

    if (mode === 'off') {
      await run('systemctl stop openwebrx 2>/dev/null');
      await run('systemctl stop spyserver 2>/dev/null');
      await run('systemctl stop rtl_tcp 2>/dev/null');
      await run('systemctl stop aiscatcher 2>/dev/null');
      await run('systemctl stop signalk 2>/dev/null');
      await new Promise((r) => setTimeout(r, 1000));
      return NextResponse.json({
        success: true,
        mode: 'off',
        message: 'All services stopped. USB tuner released.',
      });
    }

    if (mode === 'spyserver' && !fs.existsSync('/opt/spyserver/spyserver')) {
      return NextResponse.json(
        { success: false, message: 'SpyServer not installed. Install it first from the Installation Panel.' },
        { status: 400 }
      );
    }

    if (mode === 'rtltcp' && !fs.existsSync('/etc/systemd/system/rtl_tcp.service')) {
      return NextResponse.json(
        { success: false, message: 'rtl_tcp service not installed. Install it first from the Installation Panel.' },
        { status: 400 }
      );
    }

    if (mode === 'aiscatcher' && !fs.existsSync('/opt/aiscatcher/dispatcher') && !fs.existsSync('/usr/local/bin/dispatcher')) {
      return NextResponse.json(
        { success: false, message: 'AIS Catcher not installed. Install it first from the Installation Panel.' },
        { status: 400 }
      );
    }

    if (mode === 'signalk' && !fs.existsSync('/etc/systemd/system/signalk.service')) {
      return NextResponse.json(
        { success: false, message: 'SignalK not installed. Install it first from the Installation Panel.' },
        { status: 400 }
      );
    }

    const allServices = ['openwebrx', 'spyserver', 'rtltcp', 'aiscatcher', 'signalk'];
    const stopOthers = allServices.filter((s) => s !== mode);

    const serviceNameMap = {
      openwebrx: 'openwebrx',
      spyserver: 'spyserver',
      rtltcp: 'rtl_tcp',
      aiscatcher: 'aiscatcher',
      signalk: 'signalk',
    };

    const serviceName = serviceNameMap[mode];

    for (const svc of stopOthers) {
      const svcName = serviceNameMap[svc];
      await run(`systemctl stop ${svcName} 2>/dev/null`);
    }
    await run(`systemctl stop ${serviceName} 2>/dev/null`);
    await new Promise((r) => setTimeout(r, 1200));

    await run(`systemctl start ${serviceName}`);

    await new Promise((r) => setTimeout(r, 500));
    const { stdout } = await run(`systemctl is-active ${serviceName}`);

    if (stdout.trim() === 'active') {
      return NextResponse.json({
        success: true,
        mode,
        message: `Switched to ${mode} mode.`,
      });
    }

    return NextResponse.json(
      { success: false, message: `Failed to start ${mode}. Check systemctl status ${serviceName}.` },
      { status: 500 }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
