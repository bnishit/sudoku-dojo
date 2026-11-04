'use client';
import { useEffect, useRef, useState } from 'react';
import { toPng } from 'html-to-image';

const W = 1320, H = 2868;
const SLIDES = [
  ['learn', 'Learn Sudoku step by step', 'Follow short lessons from White Belt onward.', 'Learn path'],
  ['hint', 'See why a move works', 'Each lesson shows what every number blocks.', 'Hidden Single: Box lesson beam'],
  ['play', 'Put each lesson to work', 'Try your skills on a full puzzle.', 'Play board mid-game'],
  ['coach', 'Find your blind spot', 'Replay moves you missed, with help from your coach.', 'Your missed moments replay'],
  ['daily', 'Make room for one puzzle', 'Come back to a fresh daily puzzle.', 'Daily puzzle'],
  ['me', 'Build a habit that fits', 'Set a weekly goal and an optional daily reminder.', 'Me: week, blind spot and reminder'],
];
type Capture = { src: string | null; status: string; ready: boolean };
declare global { interface Window { exportStore: () => Promise<{name: string; data: string}[]> } }

function Phone({capture}: {capture: Capture}) {
  return <div style={{position:'relative', width:970, height:970 * 2082/1022, filter:'drop-shadow(0 30px 34px #0003)'}}>
    <img src="/mockup.png" alt="iPhone frame" style={{width:'100%', height:'100%'}} />
    <div style={{position:'absolute', left:`${52/1022*100}%`, top:`${46/2082*100}%`, width:`${918/1022*100}%`, height:`${1990/2082*100}%`, borderRadius:`${126/918*100}% / ${126/1990*100}%`, overflow:'hidden', background:'#FFFDF8'}}>
      {capture.src ? <img src={capture.src} alt="Supplied app capture" style={{width:'100%', height:'100%', objectFit:'contain'}} /> :
        <div style={{height:'100%', display:'grid', placeContent:'center', textAlign:'center', padding:65, boxSizing:'border-box', color:'#2A2D42', background:'repeating-linear-gradient(135deg,#fffdf8,#fffdf8 30px,#f4eee4 30px,#f4eee4 60px)'}}>
          <strong style={{fontSize:68}}>Capture pending</strong><p style={{fontSize:32}}>Real app screenshot goes here.<br/>No app UI has been drawn.</p>
        </div>}
    </div>
  </div>;
}
function Slide({index,capture}: {index:number; capture:Capture}) {
  const dark = index === 3, coral = index === 2;
  const ink = dark || coral ? '#FFFDF8' : '#2A2D42';
  const positions = [175,215,130,210,160,195];
  return <article style={{position:'relative', width:W, height:H, overflow:'hidden', color:ink, background:dark?'linear-gradient(145deg,#2A2D42,#181b2b)':coral?'linear-gradient(145deg,#E8613C,#cf4929)':index===4?'linear-gradient(150deg,#FFFDF8,#FFD98A)':'linear-gradient(145deg,#FFFDF8,#f2e8d8)', fontFamily:'Arial, sans-serif'}}>
    <div style={{position:'absolute', right:-200, top:1120, width:1050, height:1050, border:`3px solid ${dark?'#FFD98A44':'#E8613C33'}`, transform:'rotate(18deg)', backgroundSize:'350px 350px', backgroundImage:`linear-gradient(90deg,transparent 99%,${dark?'#FFD98A33':'#E8613C22'} 99%),linear-gradient(transparent 99%,${dark?'#FFD98A33':'#E8613C22'} 99%)`}} />
    <header style={{position:'absolute', top:120, left:100, right:100}}>
      <div style={{fontSize:35, letterSpacing:4, fontWeight:700, marginBottom:60}}>SUDOKU BELTS · {String(index+1).padStart(2,'0')}</div>
      <h1 style={{fontFamily:'Georgia, serif', fontSize:122, lineHeight:1.04, letterSpacing:-4, margin:'0 0 36px', maxWidth:index===3?1050:1000}}>{SLIDES[index][1]}</h1>
      <p style={{fontSize:43, lineHeight:1.3, maxWidth:1050, margin:0}}>{SLIDES[index][2]}</p>
    </header>
    <div style={{position:'absolute', top:785, left:positions[index], transform:`rotate(${[0,-1.5,1.5,-1,1,0][index]}deg)`}}><Phone capture={capture}/></div>
    {!capture.ready && <div style={{position:'absolute', bottom:80, left:65, right:65, padding:26, background:'#2A2D42', color:'#FFFDF8', border:'3px solid #FFD98A', borderRadius:20, fontSize:32, textAlign:'center', fontWeight:700}}>DRAFT · {capture.status}</div>}
  </article>;
}
async function exportNode(el: HTMLElement) {
  await document.fonts.ready;
  await Promise.all(Array.from(el.querySelectorAll('img')).map(img => img.decode()));
  Object.assign(el.style, {left:'0px', zIndex:'-1', opacity:'1'});
  try {
    const opts = {width:W, height:H, pixelRatio:1, cacheBust:false};
    await toPng(el, opts);
    return await toPng(el, opts);
  } finally { Object.assign(el.style, {left:'-9999px', zIndex:'', opacity:''}); }
}
export default function Page() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [busy,setBusy] = useState(false);
  const refs = useRef<(HTMLDivElement|null)[]>([]);
  useEffect(() => {fetch('/captures.json').then(r=>r.json()).then(setCaptures);},[]);
  useEffect(() => {
    if (captures.length !== 6) return;
    window.exportStore = async () => {
      const outputs = [];
      for (let i=0;i<6;i++) {
        outputs.push({name:`${String(i+1).padStart(2,'0')}-${SLIDES[i][0]}-1320x2868.png`, data:await exportNode(refs.current[i]!)});
        await new Promise(resolve=>setTimeout(resolve,300));
      }
      return outputs;
    };
  },[captures]);
  async function download() {
    setBusy(true);
    try { for (const file of await window.exportStore()) { const a=document.createElement('a'); a.href=file.data; a.download=file.name; a.click(); } }
    finally {setBusy(false);}
  }
  return <main style={{padding:32}}>
    <h1>Sudoku Belts · Store screenshots</h1>
    <p>Six 1320 × 2868 drafts. Only supplied captures appear inside the phone. Draft banners stay until the input is a new, full-size capture.</p>
    <button onClick={download} disabled={busy || captures.length!==6} style={{padding:'16px 24px', cursor:'pointer'}}>{busy?'Exporting…':'Download all six PNGs'}</button>
    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(264px,1fr))', gap:28, marginTop:32}}>
      {captures.map((capture,i)=><section key={i}><div style={{width:264,height:574,overflow:'hidden',borderRadius:12}}><div style={{transform:'scale(.2)',transformOrigin:'top left'}}><Slide index={i} capture={capture}/></div></div><h2>{SLIDES[i][3]}</h2><p>{capture.status}</p></section>)}
    </div>
    {captures.map((capture,i)=><div key={i} ref={el=>{refs.current[i]=el;}} style={{position:'absolute',left:-9999,top:0,width:W,height:H,fontFamily:'Arial, sans-serif'}}><Slide index={i} capture={capture}/></div>)}
  </main>;
}
