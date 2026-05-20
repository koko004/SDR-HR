import { run } from '../../lib/exec.js';
import { NextResponse } from 'next/server';

export async function POST() {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const writeLog = async (msg) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: msg })}\n\n`));
  };

  (async () => {
    try {
      await writeLog('=== Running rtl_test (checking USB tuner) ===\n\n');
      // rtl_test output is normally to stderr
      const { stdout, stderr } = await run('rtl_test -t', false);
      await writeLog(stdout + '\n' + stderr);
      await writeLog('\nDONE');
    } catch (err) {
      await writeLog(`\nERROR: ${err.message}\n`);
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
