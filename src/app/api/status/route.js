import { NextResponse } from 'next/server';
import { run } from '../../../lib/exec.js';

export async function GET() {
  try {
    const [openwebrxRes, spyserverRes, rtltcpRes] = await Promise.all([
      run('systemctl is-active openwebrx 2>/dev/null'),
      run('systemctl is-active spyserver 2>/dev/null'),
      run('systemctl is-active rtl_tcp 2>/dev/null'),
    ]);

    const openwebrx = openwebrxRes.stdout.trim() === 'active';
    const spyserver = spyserverRes.stdout.trim() === 'active';
    const rtltcp = rtltcpRes.stdout.trim() === 'active';

    let activeMode = 'off';
    if (openwebrx) activeMode = 'openwebrx';
    if (spyserver) activeMode = 'spyserver';
    if (rtltcp) activeMode = 'rtltcp';

    return NextResponse.json({
      openwebrx,
      spyserver,
      rtltcp,
      activeMode,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
