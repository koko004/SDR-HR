import { run } from "../../../../../lib/exec.js";
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await run('systemctl stop rtl_tcp 2>/dev/null');
    await run('systemctl disable rtl_tcp 2>/dev/null');
    await run('rm -f /etc/systemd/system/rtl_tcp.service');
    await run('systemctl daemon-reload');
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
