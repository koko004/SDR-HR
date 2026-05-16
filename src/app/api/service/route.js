import { NextResponse } from 'next/server';
import { run } from '../../../lib/exec.js';
import * as fs from 'fs';

export async function POST(req) {
  try {
    const body = await req.json();
    const { mode } = body;

    if (!['openwebrx', 'spyserver', 'rtltcp', 'off'].includes(mode)) {
      return NextResponse.json(
        { error: 'Invalid mode. Use: openwebrx, spyserver, rtltcp, or off' },
        { status: 400 }
      );
    }

    if (mode === 'off') {
      await run('systemctl stop openwebrx 2>/dev/null');
      await run('systemctl stop spyserver 2>/dev/null');
      await run('systemctl stop rtl_tcp 2>/dev/null');
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

    if (mode === 'rtltcp') {
      const { stdout } = await run('which rtl_tcp');
      if (!stdout.trim()) {
        return NextResponse.json(
          { success: false, message: 'rtl_tcp not found. Install it first from the Installation Panel.' },
          { status: 400 }
        );
      }
    }

    const allServices = ['openwebrx', 'spyserver', 'rtltcp'];
    const stopOthers = allServices.filter((s) => s !== mode);

    const serviceName = mode === 'rtltcp' ? 'rtl_tcp' : mode;

    for (const svc of stopOthers) {
      const svcName = svc === 'rtltcp' ? 'rtl_tcp' : svc;
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
