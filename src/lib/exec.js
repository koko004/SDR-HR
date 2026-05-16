import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';

const exec = promisify(nodeExec);

const NONINTERACTIVE_ENV = {
  ...process.env,
  DEBIAN_FRONTEND: 'noninteractive',
};

export async function run(cmd, sudo = true) {
  const command = sudo ? `sudo ${cmd}` : cmd;
  try {
    const { stdout, stderr } = await exec(command, {
      env: NONINTERACTIVE_ENV,
      maxBuffer: 1024 * 1024,
    });
    return { stdout, stderr, exitCode: 0 };
  } catch (error) {
    const err = error;
    return {
      stdout: err.stdout ?? '',
      stderr: err.stderr ?? '',
      exitCode: err.code === 'ERR_CHILD_PROCESS_EACCES' ? 13 : 1,
    };
  }
}

export async function runWithStream(cmd, onData, sudo = true) {
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    const command = sudo ? 'sudo' : cmd;
    const args = sudo ? [cmd] : cmd.split(' ');

    const child = spawn(command, args, {
      env: NONINTERACTIVE_ENV,
      shell: true,
    });

    child.stdout.on('data', (d) => onData(d.toString()));
    child.stderr.on('data', (d) => onData(d.toString()));

    child.on('close', (code) => resolve(code ?? 1));
    child.on('error', () => resolve(1));
  });
}
