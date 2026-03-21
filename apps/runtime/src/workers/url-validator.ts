import { isIP } from 'node:net';
import dns from 'node:dns/promises';

function isPrivateIP(ip: string): boolean {
  if (ip === '::1' || ip === '0.0.0.0') return true;
  if (ip.startsWith('10.') || ip.startsWith('127.') || ip.startsWith('0.') ||
      ip.startsWith('169.254.') || ip.startsWith('192.168.')) return true;
  if (ip.startsWith('172.')) {
    const second = parseInt(ip.split('.')[1] ?? '', 10);
    if (second >= 16 && second <= 31) return true;
  }
  return false;
}

export async function validateUrl(url: string): Promise<boolean> {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return false; }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const hostname = parsed.hostname;
  if (isIP(hostname)) return !isPrivateIP(hostname);
  try {
    const addresses = await dns.resolve4(hostname);
    return addresses.every((ip: string) => !isPrivateIP(ip));
  } catch { return false; }
}
