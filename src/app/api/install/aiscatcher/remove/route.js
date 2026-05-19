import { run } from "../../../../../lib/exec.js";
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await run('systemctl stop ais-catcher 2>/dev/null');
    await run('systemctl disable ais-catcher 2>/dev/null');
    await run('systemctl stop ais-catcher-reboot 2>/dev/null');
    await run('systemctl disable ais-catcher-reboot 2>/dev/null');
    await run('rm -f /etc/systemd/system/ais-catcher.service');
    await run('rm -f /etc/systemd/system/ais-catcher-reboot.service');
    await run('rm -rf /etc/AIS-catcher');
    await run('rm -rf /usr/lib/ais-catcher');
    await run('rm -f /usr/bin/AIS-catcher');
    await run('systemctl daemon-reload');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
