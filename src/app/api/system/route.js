import { NextResponse } from 'next/server';
import { exec as nodeExec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';

const exec = promisify(nodeExec);

function formatNetBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  let str = '';
  if (d > 0) str += d + 'd ';
  if (h > 0) str += h + 'h ';
  str += m + 'm';
  return str.trim() || '0m';
}

function safeReadFile(path) {
  try {
    return fs.readFileSync(path, 'utf8').trim();
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    // Temperature
    let temp = 'N/A';
    const tempRaw = safeReadFile('/sys/class/thermal/thermal_zone0/temp');
    if (tempRaw) {
      const millicelsius = parseInt(tempRaw) || 0;
      if (millicelsius > 1000) {
        temp = (millicelsius / 1000).toFixed(1) + '°C';
      } else {
        temp = tempRaw + '°C';
      }
    } else {
      const hwmon = safeReadFile('/sys/class/hwmon/hwmon0/temp1_input');
      if (hwmon) {
        temp = (parseInt(hwmon) / 1000).toFixed(1) + '°C';
      }
    }

    // CPU usage
    let cpu = 'N/A';
    try {
      const { stdout } = await exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}'");
      cpu = stdout.trim() + '%';
    } catch {
      cpu = 'N/A';
    }

    // Memory and Swap
    let ram = { used: 0, total: 0 };
    let swap = { used: 0, total: 0 };
    try {
      const { stdout } = await exec('free -b');
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        if (parts[0] === 'Mem:') {
          ram = { used: parseInt(parts[2]) || 0, total: parseInt(parts[1]) || 0 };
        }
        if (parts[0] === 'Swap:') {
          swap = { used: parseInt(parts[2]) || 0, total: parseInt(parts[1]) || 0 };
        }
      }
    } catch {
      // ignore
    }

    // Network stats
    let netRx = '0 B';
    let netTx = '0 B';
    const rxBytes = safeReadFile('/sys/class/net/eth0/statistics/rx_bytes')
      || safeReadFile('/sys/class/net/wlan0/statistics/rx_bytes');
    const txBytes = safeReadFile('/sys/class/net/eth0/statistics/tx_bytes')
      || safeReadFile('/sys/class/net/wlan0/statistics/tx_bytes');
    if (rxBytes) netRx = formatNetBytes(parseInt(rxBytes) || 0);
    if (txBytes) netTx = formatNetBytes(parseInt(txBytes) || 0);

    // Uptime
    let uptime = 'N/A';
    const uptimeRaw = safeReadFile('/proc/uptime');
    if (uptimeRaw) {
      const secs = parseFloat(uptimeRaw.split(' ')[0]) || 0;
      uptime = formatUptime(secs);
    }

    return NextResponse.json({
      temp,
      cpu,
      ram,
      swap,
      net: { rx: netRx, tx: netTx },
      uptime,
    });
  } catch (err) {
    return NextResponse.json({
      temp: 'N/A',
      cpu: 'N/A',
      ram: { used: 0, total: 0 },
      swap: { used: 0, total: 0 },
      net: { rx: '0 B', tx: '0 B' },
      uptime: 'N/A',
    });
  }
}
