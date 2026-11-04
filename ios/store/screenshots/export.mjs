import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('.', import.meta.url));
const raw = new URL('../raw/', import.meta.url);
const originalPlaceholders = [
  'bb823da4a3916b3adf784d295f4ef4762d05afc838714147107c42aed64c4eab',
  '2973f3cb53cd77ea022df660cd0484f2f244f0b5f0396165eed3a2ea791247b6',
];
await mkdir(new URL('public/captures/', import.meta.url), {recursive:true});
await mkdir(new URL('../export/', import.meta.url), {recursive:true});
const contentNotes = [
  'Learn path · White Belt · Next: Full House',
  'Hidden Single: Box lesson · beam drawn · That 4 blocks column 9 in this box',
  'Medium game in progress · 7s highlighted · 0 mistakes',
  'Your missed moments replay · move 1 of 11 · coach prompt',
  'Daily puzzle · 6s highlighted',
  'Me · 1 of 3 practice days · Hidden Single in a column blind spot · daily reminder ON',
];
const captures = [];
for (let i=0;i<6;i++) {
  const name = `${String(i+1).padStart(2,'0')}.png`;
  try {
    const data = await readFile(new URL(name,raw));
    const {width,height} = await sharp(data).metadata();
    const hash = createHash('sha256').update(data).digest('hex');
    const suppliedPlaceholder = originalPlaceholders.includes(hash);
    const ready = !suppliedPlaceholder && width===1320 && height===2868;
    await copyFile(new URL(name,raw),new URL(`public/captures/${name}`,import.meta.url));
    captures.push({src:`/captures/${name}`,ready,status:ready?`Full-size capture · ${contentNotes[i]} · human review pending`:suppliedPlaceholder?`Supplied placeholder ${name} · replacement capture pending`:`${width} × ${height} · 1320 × 2868 capture pending`});
  } catch(error) {
    if(error.code !== 'ENOENT') throw error;
    captures.push({src:null,ready:false,status:`Capture pending · ${name}`});
  }
}
await writeFile(new URL('public/captures.json', import.meta.url), JSON.stringify(captures,null,2)+'\n');
// Each run owns a local server and closes it even if an export fails.
const port = 5197;
const server = spawn(process.execPath, [root+'node_modules/next/dist/bin/next','dev','--webpack','--hostname','127.0.0.1','--port',String(port)], {cwd:root,env:{...process.env,NEXT_TELEMETRY_DISABLED:'1',WATCHPACK_POLLING:'true'},stdio:['ignore','pipe','pipe']});
let serverLog='';
server.stdout.on('data',data=>serverLog+=data);
server.stderr.on('data',data=>serverLog+=data);
let browser;
try {
  const url=`http://127.0.0.1:${port}`;
  let started=false;
  for(let attempt=0;attempt<120;attempt++) {
    if(server.exitCode!==null) throw Error(serverLog);
    try {if((await fetch(url,{signal:AbortSignal.timeout(5000)})).ok){started=true;break;}} catch {}
    await new Promise(resolve=>setTimeout(resolve,500));
  }
  if(!started) throw Error('Local screenshot server did not start.\n'+serverLog);
  browser = await chromium.launch({executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  await page.route('**/*',route => new URL(route.request().url()).hostname==='127.0.0.1' || route.request().url().startsWith('data:') ? route.continue() : route.abort());
  await page.goto(url);
  await page.waitForFunction(()=>typeof window.exportStore==='function');
  const files=await page.evaluate(()=>window.exportStore());
  for(const file of files) {
    const png=Buffer.from(file.data.split(',')[1],'base64');
    const meta=await sharp(png).metadata();
    if(meta.width!==1320 || meta.height!==2868) throw Error('Wrong export size: '+file.name);
    await sharp(png).flatten({background:'#FFFDF8'}).removeAlpha().png().toFile(fileURLToPath(new URL('../export/'+file.name,import.meta.url)));
    console.log(`${file.name} · ${meta.width} × ${meta.height}`);
  }
  await page.screenshot({path:fileURLToPath(new URL('../export/generator-preview.png',import.meta.url)),fullPage:true});
  await writeFile(new URL('../export/status.json',import.meta.url),JSON.stringify({uploadReady:false,note:'Claude must review all six captures and captions before upload.',captures},null,2)+'\n');
} finally {
  await browser?.close();
  server.kill('SIGTERM');
}
