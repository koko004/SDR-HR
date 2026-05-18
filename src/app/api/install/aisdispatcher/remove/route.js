import { run } from "../../../../../lib/exec.js";
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await run('systemctl stop ais-dispatcher 2>/dev/null');
    await run('systemctl disable ais-dispatcher 2>/dev/null');
    await run('rm -f /etc/systemd/system/ais-dispatcher.service');
    await run('loginctl terminate-user ais 2>/dev/null');
    await run('systemctl daemon-reload');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
