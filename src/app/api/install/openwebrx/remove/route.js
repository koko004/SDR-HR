import { run } from '../../../../lib/exec.js';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await run('systemctl stop openwebrx 2>/dev/null');
    await run('systemctl disable openwebrx 2>/dev/null');
    await run('apt-get purge -y openwebrx');
    await run('rm -f /etc/apt/sources.list.d/openwebrx.list');
    await run('systemctl daemon-reload');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
