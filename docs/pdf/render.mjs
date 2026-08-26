import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [,, htmlPath, outPath] = process.argv;
const PORT = 9333;
const profile = mkdtempSync(join(tmpdir(), 'chr-'));

const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  'about:blank',
], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function waitDevtools() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (r.ok) return await r.json();
    } catch {}
    await sleep(250);
  }
  throw new Error('devtools no respondió');
}

await waitDevtools();
const tgt = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: 'PUT' })).json();
const ws = new WebSocket(tgt.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);

let id = 0;
const pending = new Map();
const events = [];
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) events.push(m.method);
};
const send = (method, params = {}) => new Promise(res => {
  const i = ++id;
  pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});

await send('Page.enable');
await send('Page.navigate', { url: `file://${htmlPath}` });
for (let i = 0; i < 80 && !events.includes('Page.loadEventFired'); i++) await sleep(100);
await sleep(700);

const font = 'font-family:Helvetica Neue,Helvetica,Arial,sans-serif;font-size:7px;color:#8e8e8e;letter-spacing:.06em;width:100%;padding:0 25.4mm;box-sizing:border-box;';
const { result } = await send('Page.printToPDF', {
  printBackground: true,
  paperWidth: 8.27, paperHeight: 11.69,
  marginTop: 0.72, marginBottom: 0.68, marginLeft: 1.0, marginRight: 1.0,
  displayHeaderFooter: true,
  headerTemplate: `<div style="${font}"><span style="float:right;text-transform:uppercase">Fiberlux &middot; Despliegue en servidor propio</span></div>`,
  footerTemplate: `<div style="${font}"><span style="float:left">Twin Studios &middot; Documento técnico v1.0</span><span style="float:right">Página <span class="pageNumber"></span> de <span class="totalPages"></span></span></div>`,
});

writeFileSync(outPath, Buffer.from(result.data, 'base64'));
ws.close();
chrome.kill();
console.log('PDF escrito:', outPath);
process.exit(0);
