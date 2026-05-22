import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { ref, set, get } from "firebase/database";
import { ref as sref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import QRCode from "qrcode";
import { db, storage } from "./firebase";

/* ═══════════════════════════════════════════
   ALINA'S TRIVIA — Full Game Platform
   v3: Music type, split scoring, answer reveal
   ═══════════════════════════════════════════ */

const PRELOADED_ROUNDS = [
  {
    id:"r1", name:'Everything "A"', emoji:"🅰️",
    questions:[
      {id:"r1q1",type:"text",text:"What was the instant messaging program that operated from 1997 to 2017?",answer:"AIM",hint:"AOL product"},
      {id:"r1q2",type:"text",text:'Retailer focusing on "casual luxury" fashion and specifically "the good-looking, cool kids"',answer:"Abercrombie & Fitch"},
      {id:"r1q3",type:"text",text:'Who is the American heartthrob who stole our hearts as "Prince Charming" of North Valley High?',answer:"Austin Ames",hint:"He secretly pens romantic emails as Nomad"},
      {id:"r1q4",type:"text",text:"A range of divinatory practices, recognized as pseudoscientific, that proposes information about human affairs and terrestrial events",answer:"Astrology"},
      {id:"r1q5",type:"text",text:"Stereotype heavily associated with urban nightlife, Southern California rave and EDM culture, and a love for boba",answer:"ABG"},
      {id:"r1q6",type:"text",text:"Who was the musical guest on Saturday Night Live who was caught lip-syncing, then did an Irish jig?",answer:"Ashlee Simpson"},
      {id:"r1q7",type:"text",text:"TV series set in a largely Asian-inspired world in which some people can telekinetically manipulate one of the four elements",answer:"Avatar: The Last Airbender"},
      {id:"r1q8",type:"text",text:"Where is the largest desert in the world?",answer:"Antarctica"},
      {id:"r1q9",type:"text",text:'The quintessential "girl brunch" staple — elevating toppings like pickled onions, feta, chili crisp, and jammy eggs for a photogenic, nutrient-dense, and customizable meal',answer:"Avocado Toast"},
      {id:"r1q10",type:"text",text:"What's this plant? (Heart-shaped, glossy, tropical, bright red/pink spathe)",answer:"Anthurium"},
    ]
  },
  {
    id:"r2", name:"Weddings", emoji:"💒",
    questions:[
      {id:"r2q1",type:"range",text:"What's the average cost of a wedding in the US?",answer:"35000",min:34000,max:36000,display:"$34,000–$36,000"},
      {id:"r2q2",type:"text",text:"Which celebrity couple was married for only 72 days?",answer:"Kim Kardashian and Kris Humphries"},
      {id:"r2q3",type:"text",text:"What globally televised event combines fancy titles, features a guest list full of nobles, and at least one person bowing incorrectly?",answer:"The Royal Wedding"},
      {id:"r2q4",type:"text",text:"What dance floor song somehow appears at almost every wedding, whether requested or not?",answer:"Cha Cha Slide"},
      {id:"r2q5",type:"text",text:"What wedding tradition turns fully grown adults into competitive athletes?",answer:"Bouquet Toss"},
      {id:"r2q6",type:"range",text:"What percentage of brides still wear a traditional diamond in their wedding ring?",answer:"70",min:65,max:75,display:"~70%"},
      {id:"r2q7",type:"text",text:"What's the largest wedding destination in the United States?",answer:"Las Vegas"},
      {id:"r2q8",type:"text",text:'Who wrote this wedding speech?\n"We are gathered here today on this joyous occasion, to celebrate the special love that ____ and ____ share. It is a love based on giving and receiving. As well as having and sharing..."',answer:"Joey (from Friends)"},
      {id:"r2q9",type:"text",text:"What do wedding guests secretly rate all night long?",answer:"The Food"},
      {id:"r2q10",type:"range",text:"What's the length of the longest wedding veil ever (in meters)?",answer:"6962.6",min:6900,max:7000,display:"6,962.6 meters"},
    ]
  },
  {
    id:"r3", name:"Music Round", emoji:"🎵",
    questions:[
      {id:"r3q1",type:"music",text:"🎵 Song #1",artist:"Bruno Mars",songTitle:"Marry You",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q2",type:"music",text:"🎵 Song #2",artist:"Ed Sheeran",songTitle:"Perfect",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q3",type:"music",text:"🎵 Song #3",artist:"Taylor Swift",songTitle:"Love Story",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q4",type:"music",text:"🎵 Song #4",artist:"Taeyang",songTitle:"Wedding Dress",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q5",type:"music",text:"🎵 Song #5",artist:"The Dixie Cups",songTitle:"Chapel of Love",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q6",type:"music",text:"🎵 Song #6",artist:"J.R.A.",songTitle:"By Chance (You & I)",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q7",type:"music",text:"🎵 Song #7",artist:"Calum Scott & Leona Lewis",songTitle:"You Are the Reason",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q8",type:"music",text:"🎵 Song #8",artist:"Phillipa Soo (Hamilton)",songTitle:"Helpless",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q9",type:"music",text:"🎵 Song #9",artist:"Auburn",songTitle:"Perfect Two",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q10",type:"music",text:"🎵 Song #10",artist:"Katherine Ho",songTitle:"Yellow",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q11",type:"music",text:"🎵 Song #11",artist:"Snow Patrol",songTitle:"Chasing Cars",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q12",type:"music",text:"🎵 Song #12",artist:"Hannah Montana",songTitle:"He Could Be The One",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q13",type:"music",text:"🎵 Song #13",artist:"Train",songTitle:"Marry Me",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q14",type:"music",text:"🎵 Song #14",artist:"Vanessa Hudgens & Zac Efron",songTitle:"Can I Have This Dance",ytUrl:"",ytStart:"",ytEnd:""},
      {id:"r3q15",type:"music",text:"🎵 Song #15",artist:"Mendelssohn",songTitle:"Wedding March",ytUrl:"",ytStart:"",ytEnd:""},
    ]
  },
  {
    id:"r4", name:"Romcom or Real Life?", emoji:"🎬",
    questions:[
      {id:"r4q1",type:"choice",text:"A woman accidentally sends a text meant for her friend to a complete stranger. They keep talking, meet up, and eventually fall in love.",options:["Romcom","Real Life"],answer:"Real Life"},
      {id:"r4q2",type:"choice",text:"Two people who hate each other pretend to be a couple for social reasons, but unexpectedly develop real feelings.",options:["Romcom","Real Life"],answer:"Romcom"},
      {id:"r4q3",type:"choice",text:"After making a birthday wish, a teenage girl wakes up as her 30-year-old self and reconnects with her childhood best friend.",options:["Romcom","Real Life"],answer:"Romcom"},
      {id:"r4q4",type:"choice",text:"A couple meets because their dogs keep escaping and find each other at the same park. The humans eventually start dating too.",options:["Romcom","Real Life"],answer:"Real Life"},
      {id:"r4q5",type:"choice",text:"A woman travels to meet her boyfriend's family and discovers he comes from one of the wealthiest families in the country, throwing her into a world she never expected.",options:["Romcom","Real Life"],answer:"Romcom"},
      {id:"r4q6",type:"choice",text:"Two strangers discover they were accidentally booked into the same vacation rental and agree to share it for the weekend.",options:["Romcom","Real Life"],answer:"Real Life"},
      {id:"r4q7",type:"choice",text:"A middle-aged man gets unexpected help reinventing himself after his marriage falls apart, leading to new romance, awkward encounters, and surprising connections.",options:["Romcom","Real Life"],answer:"Romcom"},
      {id:"r4q8",type:"choice",text:"A couple reconnects after discovering they had unknowingly attended the same preschool, camp, and college orientation years before meeting.",options:["Romcom","Real Life"],answer:"Real Life"},
      {id:"r4q9",type:"choice",text:"Two women living in different countries swap homes for the holidays after heartbreak, and each unexpectedly finds love in her temporary new life.",options:["Romcom","Real Life"],answer:"Romcom"},
      {id:"r4q10",type:"choice",text:"Two people meet while arguing in the comments section of a neighborhood Facebook post — and later get married.",options:["Romcom","Real Life"],answer:"Real Life"},
    ]
  }
];

// ─── Helpers ─────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 8);
const genCode = () => Math.random().toString(36).slice(2, 6).toUpperCase();
function normalize(s) { return (s||"").toLowerCase().replace(/[^a-z0-9]/g,"").trim(); }

// True when guess and correct differ by at most one insert, delete, or substitution.
function withinOneEdit(a, b) {
  if (a === b) return true;
  const m = a.length, n = b.length;
  if (Math.abs(m - n) > 1) return false;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, cur[j]);
    }
    if (rowMin > 1) return false;
    prev = cur;
  }
  return prev[n] <= 1;
}

function fuzzyMatch(guess, correct) {
  const g = normalize(guess), c = normalize(correct);
  if (!g || !c) return false;
  if (g === c) return true;
  if (c.includes(g) && g.length > 2) return true;
  if (g.includes(c) && c.length > 2) return true;
  const parts = correct.split(/\s*(?:and|&|,|-)\s*/i).map(normalize);
  if (parts.length > 1 && parts.every(p => g.includes(p))) return true;
  // Close enough: one-letter typo (antartica → antarctica, etc.)
  if (withinOneEdit(g, c)) return true;
  return false;
}

// Per-round base point value (each "correct match" is worth this much).
// Music questions naturally split into artist + song = 2 matches, so they're worth 2× base.
function roundPts(round) {
  const v = round?.pointsPerQuestion;
  if (v === undefined || v === null || v === "") return 1;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

// Max possible points for a question given its round
function maxPoints(q, round) {
  const base = roundPts(round);
  return q.type === "music" ? base * 2 : base;
}

// Returns points the player earned for a question (auto-scored, before host overrides)
function scoreAnswer(question, playerAnswer, round) {
  if (!playerAnswer) return 0;
  const base = roundPts(round);
  if (question.type === "music") {
    const ans = typeof playerAnswer === "object" ? playerAnswer : {};
    let pts = 0;
    if (fuzzyMatch(ans.artist || "", question.artist || "")) pts += base;
    if (fuzzyMatch(ans.songTitle || "", question.songTitle || "")) pts += base;
    return pts;
  }
  if (question.type === "choice") return normalize(playerAnswer) === normalize(question.answer) ? base : 0;
  if (question.type === "range") {
    const num = parseFloat(String(playerAnswer).replace(/[^0-9.\-]/g,""));
    if (isNaN(num)) return 0;
    return num >= (question.min ?? -Infinity) && num <= (question.max ?? Infinity) ? base : 0;
  }
  return fuzzyMatch(playerAnswer, question.answer) ? base : 0;
}

// Effective points = host override (if set) else the auto-scored value
function getEffectivePoints(q, playerId, playerAnswer, overrides = {}, round) {
  const key = `${q.id}:${playerId}`;
  if (overrides && key in overrides) return overrides[key];
  return scoreAnswer(q, playerAnswer, round);
}

// Helper: build a {questionId -> round} lookup from a rounds array
function buildRoundIndex(rounds) {
  const m = {};
  (rounds || []).forEach(r => (r.questions || []).forEach(q => { m[q.id] = r; }));
  return m;
}

function extractYTId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
}

function parseTime(t) {
  if (!t && t !== 0) return null;
  const s = String(t).trim();
  if (!s) return null;
  if (s.includes(":")) { const p=s.split(":").map(Number); return p.length===2?p[0]*60+p[1]:p.length===3?p[0]*3600+p[1]*60+p[2]:null; }
  const n=parseFloat(s); return isNaN(n)?null:Math.round(n);
}

// ─── Slide Sequence Builder ──────────────
const DEFAULT_COVER={title:"TriviaHost",subtitle:"",emoji:"🎉",image:""};

function buildSlides(rounds, includeObj=true, cover=null) {
  const s=[], pairs=[];
  if(cover) s.push({type:"cover",...(includeObj?{cover}:{})});
  for(let i=0;i<rounds.length;i+=2) pairs.push(rounds.slice(i,i+2));
  pairs.forEach((pair,pi)=>{
    pair.forEach((round,li)=>{
      const ri=pi*2+li;
      s.push({type:"round-title",...(includeObj?{round}:{}),roundIdx:ri,phase:"questions"});
      round.questions.forEach((q,qi)=>{
        s.push({type:"question",...(includeObj?{round,question:q}:{}),roundIdx:ri,questionId:q.id,questionIdx:qi});
      });
    });
    s.push({type:"divider",pairIdx:pi});
    pair.forEach((round,li)=>{
      const ri=pi*2+li;
      s.push({type:"round-title",...(includeObj?{round}:{}),roundIdx:ri,phase:"answers"});
      round.questions.forEach((q,qi)=>{
        s.push({type:"answer",...(includeObj?{round,question:q}:{}),roundIdx:ri,questionId:q.id,questionIdx:qi});
      });
    });
    // Insert a mid-game leaderboard after every pair except the last.
    // For a 4-round game this puts it right after Round 2 answers.
    if(pi<pairs.length-1) s.push({type:"leaderboard",pairIdx:pi});
  });
  s.push({type:"results"});
  return s;
}

// ─── Storage (Firebase Realtime Database) ─────────────────────
// Converts key format "game:ABCD:player:xyz" → Firebase path "game/ABCD/player/xyz"
function toPath(k) { return k.replace(/:/g, "/"); }

async function storageSet(k, v, sh=false) {
  try { await set(ref(db, toPath(k)), v); }
  catch(e) { console.error("storageSet error:", k, e); }
}

async function storageGet(k, sh=false) {
  try {
    const snap = await get(ref(db, toPath(k)));
    return snap.exists() ? snap.val() : null;
  } catch(e) { return null; }
}

async function storageList(prefix, sh=false) {
  try {
    // prefix like "game:ABCD:player:" → path "game/ABCD/player"
    const path = toPath(prefix).replace(/\/$/, "");
    const snap = await get(ref(db, path));
    if (!snap.exists()) return [];
    const keys = [];
    snap.forEach(child => { keys.push(prefix + child.key); });
    return keys;
  } catch(e) { return []; }
}

// ─── Session + URL helpers ───────────────
// Persisted in localStorage so the host or a player can rejoin a room
// after a refresh, navigation, or closing the tab.
function lsGet(k){try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch{return null}}
function lsSet(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}
function lsDel(k){try{localStorage.removeItem(k)}catch{}}
const SESSION_HOST_KEY=c=>`triviahost:host:${c}`;
const SESSION_PLAYER_KEY=c=>`triviahost:player:${c}`;
// Allow short alphanumeric codes — matches genCode() output (4 chars uppercase)
function parsePathCode(){
  if(typeof window==="undefined")return null;
  const m=window.location.pathname.match(/^\/([A-Z0-9]{2,8})$/i);
  return m?m[1].toUpperCase():null;
}
function gameUrl(code){
  if(typeof window==="undefined")return code;
  return `${window.location.origin}/${code}`;
}
function pushUrl(path){
  if(typeof window==="undefined")return;
  if(window.location.pathname===path)return;
  try{window.history.pushState({},"",path)}catch{}
}

// ─── QR Code ─────────────────────────────
function QRDisplay({text,size=192,color="#E8E8F0",bg="#0d0d25"}){
  const ref=useRef(null);
  useEffect(()=>{
    if(!ref.current||!text)return;
    QRCode.toCanvas(ref.current,text,{
      width:size,
      margin:1,
      color:{dark:color,light:bg},
      errorCorrectionLevel:"M",
    }).catch(()=>{});
  },[text,size,color,bg]);
  return <canvas ref={ref} width={size} height={size} style={{borderRadius:8,display:"block"}}/>;
}
// ─── Confetti ────────────────────────────
function Confetti({active}){
  const pieces=useMemo(()=>Array.from({length:50},(_,i)=>({id:i,left:Math.random()*100,delay:Math.random()*2,dur:2+Math.random()*2,color:["#FF6B9D","#C850C0","#4158D0","#FFCF48","#43E97B","#FA709A","#FEE140"][i%7],size:6+Math.random()*8,rot:Math.random()*360})),[]);
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:999,overflow:"hidden"}}>
      <style>{`@keyframes cFall{0%{transform:translateY(-20px) rotate(0);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map(p=><div key={p.id} style={{position:"absolute",left:`${p.left}%`,top:-20,width:p.size,height:p.size*.6,borderRadius:2,background:p.color,transform:`rotate(${p.rot}deg)`,animation:`cFall ${p.dur}s ease-in ${p.delay}s forwards`}}/>)}
    </div>
  );
}

// ─── YouTube Player ──────────────────────
// showVideo: toggles video visibility via CSS without recreating the iframe (audio keeps playing)
// enforceEnd: when false, end timestamp ignored — clip plays until host stops
// autoStart: when this flips to true and the clip hasn't been played yet, start automatically
function YTPlayer({videoId,start,end,enforceEnd=true,showVideo=false,autoStart=false}){
  const[status,setStatus]=useState("idle"); // idle | playing | stopped
  const playerRef=useRef(null);
  const containerRef=useRef(null);
  const timerRef=useRef(null);
  const startSec=parseTime(start)||0;
  const endSec=enforceEnd?parseTime(end):null;

  useEffect(()=>{
    if(window.YT) return;
    const tag=document.createElement("script");
    tag.src="https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  },[]);

  const destroyPlayer=useCallback(()=>{
    if(timerRef.current){clearInterval(timerRef.current);timerRef.current=null;}
    if(playerRef.current?.destroy){playerRef.current.destroy();playerRef.current=null;}
  },[]);

  // Auto-start when autoStart flips on, but only if the clip hasn't been played yet
  useEffect(()=>{
    if(autoStart&&status==="idle") setStatus("playing");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[autoStart]);

  // Initialize the YT player when status becomes "playing".
  // showVideo intentionally omitted from deps so toggling it doesn't recreate the iframe.
  useEffect(()=>{
    if(status!=="playing") return;
    const handleEnd=()=>{destroyPlayer();setStatus("stopped");};
    const initPlayer=()=>{
      if(!containerRef.current) return;
      playerRef.current=new window.YT.Player(containerRef.current,{
        videoId,
        width:480,height:270,
        playerVars:{
          autoplay:1,
          start:startSec,
          ...(endSec?{end:endSec}:{}),
          modestbranding:1,
          rel:0,
          playsinline:1,
        },
        events:{
          onReady:(e)=>{e.target.playVideo()},
          onStateChange:(e)=>{
            if(e.data===window.YT.PlayerState.ENDED) handleEnd();
          },
        },
      });
      if(endSec&&endSec>startSec){
        timerRef.current=setInterval(()=>{
          if(playerRef.current?.getCurrentTime&&playerRef.current.getCurrentTime()>=endSec) handleEnd();
        },500);
      }
    };
    if(window.YT&&window.YT.Player) initPlayer();
    else window.onYouTubeIframeAPIReady=initPlayer;
    return destroyPlayer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[status,videoId,startSec,endSec,destroyPlayer]);

  const playBtn=(
    <button onClick={()=>setStatus("playing")} style={{background:"linear-gradient(135deg,#FF6B9D,#C850C0)",border:"none",borderRadius:20,padding:"16px 36px",color:"#fff",fontFamily:"'Righteous',cursive",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s",boxShadow:"0 4px 24px #C850C044"}}
    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <span style={{fontSize:28}}>▶</span> {status==="stopped"?"Replay Clip":"Play Clip"}
    </button>
  );

  if(status==="idle") return playBtn;

  const eqActive=status==="playing";
  // Stable container — visibility is purely CSS-controlled, so the audio
  // continues seamlessly when the host toggles the video on at reveal time.
  const wrapperStyle=showVideo?{
    borderRadius:14,overflow:"hidden",border:"2px solid #C850C044",
    boxShadow:"0 4px 30px #C850C033",width:480,height:270,background:"#000",
  }:{
    width:1,height:1,overflow:"hidden",opacity:0,
    position:"absolute",left:-9999,top:-9999,pointerEvents:"none",
  };
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,position:"relative"}}>
      <div style={wrapperStyle} aria-hidden={!showVideo}>
        <div ref={containerRef}/>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center"}}>
        <style>{`@keyframes eqB{0%,100%{height:6px}50%{height:20px}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 18px",borderRadius:12,background:"#C850C022",border:"1px solid #C850C044"}}>
          <div style={{display:"flex",alignItems:"end",gap:2,height:20}}>
            {[0,.12,.24,.08,.2].map((d,i)=><div key={i} style={{width:3,borderRadius:2,background:"linear-gradient(180deg,#FF6B9D,#C850C0)",animation:eqActive?`eqB ${.4+Math.random()*.4}s ease-in-out ${d}s infinite`:"none",height:eqActive?undefined:6}}/>)}
          </div>
        </div>
        {status==="playing"?(
          <button onClick={()=>{destroyPlayer();setStatus("stopped")}} style={{background:"#FF6B9D22",border:"1px solid #FF6B9D44",borderRadius:8,padding:"8px 16px",color:"#FF6B9D",cursor:"pointer",fontFamily:"'Quicksand',sans-serif",fontSize:13,fontWeight:600}}>Stop</button>
        ):(
          <button onClick={()=>setStatus("playing")} style={{background:"#43E97B22",border:"1px solid #43E97B44",borderRadius:8,padding:"8px 16px",color:"#43E97B",cursor:"pointer",fontFamily:"'Quicksand',sans-serif",fontSize:13,fontWeight:600}}>Replay</button>
        )}
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────
const font=`'Quicksand',sans-serif`;
const dFont=`'Righteous',cursive`;
const T={bg:"#0B0B1A",card:"#151530",cb:"#252550",acc:"#C850C0",gold:"#FFCF48",grn:"#43E97B",pink:"#FF6B9D",txt:"#E8E8F0",mut:"#8888AA",
  grad:"linear-gradient(135deg,#4158D0 0%,#C850C0 50%,#FFCB80 100%)",gbtn:"linear-gradient(135deg,#C850C0,#4158D0)"};
const bBtn={fontFamily:dFont,fontSize:16,fontWeight:700,border:"none",borderRadius:14,padding:"14px 32px",cursor:"pointer",transition:"all .2s",color:"#fff",letterSpacing:.5};
const cSty={background:T.card,border:`1px solid ${T.cb}`,borderRadius:18,padding:24};

function GT({children,style}){return <span style={{background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text",...style}}>{children}</span>}

function Btn({children,onClick,variant="primary",style,disabled}){
  const bg=variant==="primary"?T.gbtn:variant==="gold"?`linear-gradient(135deg,${T.gold},#FF9A44)`:variant==="green"?`linear-gradient(135deg,${T.grn},#38F9D7)`:variant==="ghost"?"transparent":variant==="reveal"?"linear-gradient(135deg,#FA709A,#FF6B9D)":T.gbtn;
  const bdr=variant==="ghost"?`2px solid ${T.cb}`:"none";
  const clr=variant==="gold"?"#1a1a2e":variant==="green"?"#0B0B1A":"#fff";
  return <button onClick={onClick} disabled={disabled} style={{...bBtn,background:bg,border:bdr,color:clr,opacity:disabled?.5:1,...style}}>{children}</button>;
}

function Inp({value,onChange,placeholder,style,type="text",multiline,onKeyDown,autoFocus}){
  const sh={fontFamily:font,fontSize:15,color:T.txt,background:"#0d0d25",border:`1px solid ${T.cb}`,borderRadius:12,padding:"12px 16px",width:"100%",outline:"none",boxSizing:"border-box",transition:"border-color .2s"};
  if(multiline)return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} onKeyDown={onKeyDown} autoFocus={autoFocus} style={{...sh,resize:"vertical",...style}}/>;
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus} style={{...sh,...style}}/>;
}

const globalCSS=`@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Quicksand:wght@400;600;700&display=swap');*{box-sizing:border-box}`;

// ─── Giphy + Image Picker ────────────────
const ENV_GIPHY_KEY=(()=>{try{return import.meta.env.VITE_GIPHY_KEY||""}catch{return""}})();

function GiphyPicker({onPick,onClose}){
  const[apiKey,setApiKey]=useState(()=>{
    try{const ls=localStorage.getItem("triviahost:giphyKey");if(ls)return ls;}catch{}
    return ENV_GIPHY_KEY;
  });
  const[keyInput,setKeyInput]=useState("");
  const[query,setQuery]=useState("");
  const[results,setResults]=useState([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");

  async function search(q){
    if(!apiKey||!q.trim())return;
    setLoading(true);setError("");
    try{
      const r=await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(q)}&limit=24&rating=g`);
      const j=await r.json();
      if(j.meta?.status!==200){setError(j.meta?.msg||"Search failed — check your API key");setResults([]);}
      else setResults(j.data||[]);
    }catch(e){setError("Network error: "+e.message);}
    finally{setLoading(false);}
  }
  function saveKey(){const v=keyInput.trim();if(!v)return;try{localStorage.setItem("triviahost:giphyKey",v)}catch{}setApiKey(v);setKeyInput("");}
  function clearKey(){
    try{localStorage.removeItem("triviahost:giphyKey")}catch{}
    setApiKey("");setResults([]);setQuery("");
  }
  function useDefault(){
    try{localStorage.removeItem("triviahost:giphyKey")}catch{}
    setApiKey(ENV_GIPHY_KEY);setKeyInput("");
  }

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.8)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{...cSty,maxWidth:640,width:"100%",maxHeight:"85vh",display:"flex",flexDirection:"column",border:`1px solid ${T.acc}44`,color:T.txt}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
          <h3 style={{fontFamily:dFont,fontSize:20,margin:0}}><GT>🎞 Search Giphy</GT></h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        {!apiKey?(
          <div>
            <p style={{color:T.mut,fontSize:14,marginBottom:10,lineHeight:1.5}}>Paste a Giphy API key (free at <a href="https://developers.giphy.com/dashboard/" target="_blank" rel="noopener noreferrer" style={{color:T.acc}}>developers.giphy.com</a>). Stored locally on this device only.</p>
            <Inp value={keyInput} onChange={setKeyInput} placeholder="Paste Giphy API key..." onKeyDown={e=>e.key==="Enter"&&saveKey()}/>
            <div style={{display:"flex",gap:8,marginTop:10}}>
              <Btn onClick={saveKey} variant="gold" style={{flex:1}} disabled={!keyInput.trim()}>Save Key</Btn>
              {ENV_GIPHY_KEY&&<Btn onClick={useDefault} variant="ghost" style={{padding:"10px 16px"}}>Use Default</Btn>}
            </div>
          </div>
        ):(
          <>
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <Inp value={query} onChange={setQuery} placeholder="Search GIFs..." autoFocus onKeyDown={e=>{if(e.key==="Enter")search(query)}} style={{flex:1}}/>
              <Btn onClick={()=>search(query)} style={{fontSize:14,padding:"10px 20px"}} disabled={loading||!query.trim()}>Search</Btn>
            </div>
            {error&&<div style={{color:T.pink,fontSize:13,marginBottom:8}}>{error}</div>}
            {loading&&<div style={{color:T.mut,textAlign:"center",padding:20,fontSize:14}}>Loading…</div>}
            <div style={{flex:1,overflowY:"auto",display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8,minHeight:results.length?200:0}}>
              {results.map(g=>(
                <img key={g.id} src={g.images.fixed_width.url} alt={g.title} onClick={()=>onPick(g.images.original.url)} style={{width:"100%",height:120,objectFit:"cover",borderRadius:8,cursor:"pointer",border:"2px solid transparent",transition:"all .15s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.transform="scale(1.03)"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="transparent";e.currentTarget.style.transform="scale(1)"}}/>
              ))}
            </div>
            <div style={{marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:11,color:T.mut}}>
              <span>Powered by GIPHY{apiKey===ENV_GIPHY_KEY&&ENV_GIPHY_KEY?" · using app default key":""}</span>
              <button onClick={clearKey} style={{background:"none",border:"none",color:T.mut,textDecoration:"underline",cursor:"pointer",fontSize:11,fontFamily:font}}>{apiKey===ENV_GIPHY_KEY&&ENV_GIPHY_KEY?"Override key":"Change API key"}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function ImagePicker({label,value,onChange}){
  const[showGiphy,setShowGiphy]=useState(false);
  const[showUrl,setShowUrl]=useState(false);
  const[urlInput,setUrlInput]=useState("");
  const[uploading,setUploading]=useState(false);
  const[uploadProgress,setUploadProgress]=useState(0);
  const[uploadError,setUploadError]=useState("");
  const fileRef=useRef(null);
  const uploadTaskRef=useRef(null);

  function friendlyStorageError(err){
    const code=err?.code||"";
    if(code.includes("unauthorized")||code.includes("permission")) return "Permission denied. Open Firebase Console → Storage → Rules and allow writes (for testing: allow read, write: if true;).";
    if(code.includes("bucket")||code.includes("not-found")) return "Storage bucket not found. Open Firebase Console → Storage → Get Started to enable Cloud Storage (requires Blaze plan).";
    if(code.includes("retry-limit")||code.includes("unknown")||code.includes("network")) return "Upload could not reach Firebase Storage. Likely Storage isn't enabled for this project, or your network is blocking the request. Try the Giphy or URL options.";
    if(code.includes("quota")) return "Storage quota exceeded.";
    if(code.includes("canceled")) return "Upload canceled.";
    return err?.message||err?.code||"Unknown error";
  }

  async function handleUpload(e){
    const file=e.target.files?.[0];if(!file)return;
    if(file.size>10*1024*1024){setUploadError("File too large (max 10MB)");if(fileRef.current)fileRef.current.value="";return;}
    setUploading(true);setUploadProgress(0);setUploadError("");
    let cleared=false;
    const finish=()=>{if(cleared)return;cleared=true;setUploading(false);setUploadProgress(0);uploadTaskRef.current=null;if(fileRef.current)fileRef.current.value="";};
    try{
      const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
      const path=`trivia-images/${Date.now()}-${safe}`;
      const fileRef2=sref(storage,path);
      const task=uploadBytesResumable(fileRef2,file);
      uploadTaskRef.current=task;
      // Hard timeout: if no progress for 45s after start, assume Storage isn't reachable
      const timeoutId=setTimeout(()=>{try{task.cancel()}catch{};console.warn("Upload timeout — Firebase Storage likely not enabled.");},45000);
      await new Promise((resolve,reject)=>{
        task.on("state_changed",
          snap=>{const pct=snap.totalBytes?Math.round((snap.bytesTransferred/snap.totalBytes)*100):0;setUploadProgress(pct);},
          err=>{clearTimeout(timeoutId);reject(err);},
          ()=>{clearTimeout(timeoutId);resolve();}
        );
      });
      const url=await getDownloadURL(fileRef2);
      onChange(url);
      finish();
    }catch(err){
      console.error("Storage upload error:",err);
      setUploadError("Upload failed — "+friendlyStorageError(err));
      finish();
    }
  }
  function cancelUpload(){try{uploadTaskRef.current?.cancel()}catch{}}

  const smBtn={fontSize:11,padding:"6px 10px",borderRadius:8,fontFamily:font,fontWeight:600,cursor:"pointer",border:`1px solid ${T.cb}`,background:"#1a1a3e",color:T.txt,transition:"all .15s"};

  return (
    <div style={{padding:12,borderRadius:12,background:"#0d0d25",border:`1px solid ${T.cb}`,marginBottom:10}}>
      <div style={{fontSize:11,color:T.mut,marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
      {value?(
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <img src={value} alt="" style={{maxWidth:140,maxHeight:90,objectFit:"cover",borderRadius:8,border:`1px solid ${T.cb}`,background:"#000"}}/>
          <div style={{display:"flex",flexDirection:"column",gap:4,flex:1,minWidth:0}}>
            <div style={{fontSize:11,color:T.mut,wordBreak:"break-all",lineHeight:1.3,maxHeight:36,overflow:"hidden"}}>{value.length>60?value.slice(0,60)+"…":value}</div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
              <button onClick={()=>setShowGiphy(true)} style={smBtn}>🎞 Giphy</button>
              <button onClick={()=>setShowUrl(true)} style={smBtn}>🔗 URL</button>
              <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{...smBtn,opacity:uploading?.6:1}}>{uploading?"…":"📁 Upload"}</button>
              <button onClick={()=>onChange("")} style={{...smBtn,color:T.pink,borderColor:`${T.pink}66`}}>✕ Remove</button>
            </div>
          </div>
        </div>
      ):(
        <div style={{display:"flex",gap:6,flexWrap:"wrap",alignItems:"center"}}>
          <button onClick={()=>setShowGiphy(true)} style={smBtn} disabled={uploading}>🎞 Search Giphy</button>
          <button onClick={()=>setShowUrl(s=>!s)} style={smBtn} disabled={uploading}>🔗 Paste URL</button>
          <button onClick={()=>fileRef.current?.click()} disabled={uploading} style={{...smBtn,opacity:uploading?.6:1}}>{uploading?`Uploading ${uploadProgress}%…`:"📁 Upload"}</button>
          {uploading&&<button onClick={cancelUpload} style={{...smBtn,color:T.pink,borderColor:`${T.pink}66`}}>Cancel</button>}
        </div>
      )}
      {showUrl&&!value&&(
        <div style={{marginTop:8,display:"flex",gap:6}}>
          <Inp value={urlInput} onChange={setUrlInput} placeholder="https://..." onKeyDown={e=>{if(e.key==="Enter"&&urlInput.trim()){onChange(urlInput.trim());setUrlInput("");setShowUrl(false);}}} style={{flex:1,fontSize:13,padding:"8px 12px"}}/>
          <button onClick={()=>{if(urlInput.trim()){onChange(urlInput.trim());setUrlInput("");setShowUrl(false);}}} style={smBtn}>Set</button>
          <button onClick={()=>{setUrlInput("");setShowUrl(false)}} style={smBtn}>✕</button>
        </div>
      )}
      {uploadError&&<div style={{marginTop:8,fontSize:11,color:T.pink,lineHeight:1.4}}>{uploadError}</div>}
      <input type="file" ref={fileRef} accept="image/*,image/gif" onChange={handleUpload} style={{display:"none"}}/>
      {showGiphy&&<GiphyPicker onPick={url=>{onChange(url);setShowGiphy(false)}} onClose={()=>setShowGiphy(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════
function HomeScreen({onNavigate}){
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:font}}>
      <style>{globalCSS}{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{animation:"float 3s ease-in-out infinite",marginBottom:12,fontSize:64}}>🎉</div>
      <h1 style={{fontFamily:dFont,fontSize:48,margin:0,textAlign:"center"}}><GT>TriviaHost</GT></h1>
      <p style={{color:T.mut,fontSize:16,marginTop:8,marginBottom:48,textAlign:"center"}}>Build · Present · Play</p>
      <div style={{display:"flex",flexDirection:"column",gap:16,width:"100%",maxWidth:380}}>
        {[{icon:"🛠️",label:"Build Trivia",desc:"Create & edit questions",target:"builder"},{icon:"🎤",label:"Host a Game",desc:"Present to your crowd",target:"host-lobby"},{icon:"📱",label:"Join as Player",desc:"Answer on your device",target:"player-join"}].map((it,i)=>(
          <button key={it.target} onClick={()=>onNavigate(it.target)} style={{...cSty,display:"flex",alignItems:"center",gap:16,cursor:"pointer",textAlign:"left",width:"100%",transition:"all .2s",animation:`slideUp .5s ease ${i*.1}s both`}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.transform="translateX(6px)"}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.cb;e.currentTarget.style.transform="translateX(0)"}}>
            <span style={{fontSize:36}}>{it.icon}</span>
            <div><div style={{fontFamily:dFont,fontSize:20,color:T.txt}}>{it.label}</div><div style={{fontSize:13,color:T.mut,marginTop:2}}>{it.desc}</div></div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  BUILDER
// ═══════════════════════════════════════════
function Builder({cover,setCover,rounds,setRounds,onBack,onStartHost}){
  const[activeRound,setActiveRound]=useState(0); // -1 = cover slide editor
  const[editingQ,setEditingQ]=useState(null);
  const[showAddRound,setShowAddRound]=useState(false);
  const[newRoundName,setNewRoundName]=useState("");
  const[showRoundSettings,setShowRoundSettings]=useState(false);
  const round=activeRound>=0?rounds[activeRound]:null;

  function addRound(){if(!newRoundName.trim())return;setRounds(p=>[...p,{id:genId(),name:newRoundName.trim(),emoji:"❓",image:"",pointsPerQuestion:1,questions:[]}]);setNewRoundName("");setShowAddRound(false);setActiveRound(rounds.length)}
  function deleteRound(idx){setRounds(p=>p.filter((_,i)=>i!==idx));setActiveRound(Math.max(0,activeRound-1))}
  function addQuestion(){const nq={id:genId(),type:"text",text:"",answer:"",hint:""};setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:[...r.questions,nq]}:r));setEditingQ(round.questions.length)}
  function updateQ(qi,u){setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:r.questions.map((q,j)=>j===qi?{...q,...u}:q)}:r))}
  function deleteQ(qi){setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:r.questions.filter((_,j)=>j!==qi)}:r));setEditingQ(null)}
  function updateRound(u){setRounds(p=>p.map((r,i)=>i===activeRound?{...r,...u}:r))}
  function updateCover(u){setCover(c=>({...c,...u}))}

  const typeLabel=t=>t==="choice"?"Multiple Choice":t==="range"?"Number Range":t==="music"?"🎵 Music":"Text";
  const typeColor=t=>t==="choice"?"#7B93FF":t==="range"?T.grn:t==="music"?T.pink:T.acc;
  const typeBg=t=>t==="choice"?"#4158D044":t==="range"?"#43E97B33":t==="music"?"#FF6B9D33":"#C850C044";

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt}}>
      <style>{globalCSS}{`
        .builder-shell{display:flex;min-height:calc(100vh - 65px)}
        .builder-aside{width:240px;border-right:1px solid ${T.cb};padding:16px;flex-shrink:0;overflow-y:auto;max-height:calc(100vh - 65px);box-sizing:border-box}
        .builder-main{flex:1;padding:24px;overflow-y:auto;max-height:calc(100vh - 65px);min-width:0;box-sizing:border-box}
        .builder-aside-sec{font-size:11px;text-transform:uppercase;letter-spacing:1px;color:${T.mut};margin-bottom:8px}
        .builder-aside-item{padding:10px 14px;border-radius:12px;cursor:pointer;margin-bottom:6px;min-width:0}
        .builder-newround{margin-top:8px}
        .builder-newround-btn{width:100%;padding:10px;background:none;border:1px dashed ${T.cb};border-radius:12px;color:${T.mut};cursor:pointer;font-family:${font};font-size:13px;margin-top:4px;box-sizing:border-box}
        @media (max-width:760px){
          .builder-shell{flex-direction:column}
          .builder-aside{
            width:100%;max-height:none;border-right:none;border-bottom:1px solid ${T.cb};
            padding:10px 12px;overflow-x:auto;overflow-y:hidden;
            display:flex;gap:8px;align-items:stretch;
          }
          .builder-aside-sec{display:none}
          .builder-aside-item{
            margin-bottom:0;flex-shrink:0;min-width:150px;max-width:220px;
            white-space:nowrap;padding:8px 12px;
          }
          .builder-aside-item .builder-aside-item-sub{
            white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          }
          .builder-newround{margin-top:0;flex-shrink:0;min-width:160px;align-self:center}
          .builder-newround-btn{margin-top:0;padding:8px 12px;white-space:nowrap}
          .builder-main{padding:16px;max-height:none;flex:1 1 auto}
        }
      `}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:`1px solid ${T.cb}`,gap:12,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontFamily:font,fontSize:14}}>← Back</button>
        <h2 style={{fontFamily:dFont,fontSize:22,margin:0}}><GT>Trivia Builder</GT></h2>
        <Btn onClick={onStartHost} variant="gold" style={{fontSize:13,padding:"10px 20px"}}>▶ Host This</Btn>
      </div>
      <div className="builder-shell">
        {/* Sidebar — vertical list on desktop, horizontal chip-strip on mobile */}
        <div className="builder-aside">
          <div className="builder-aside-sec">Intro</div>
          <div className="builder-aside-item" onClick={()=>setActiveRound(-1)} style={{background:activeRound===-1?"#1e1e45":"transparent",border:activeRound===-1?`1px solid ${T.gold}55`:"1px solid transparent",marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:600,display:"flex",alignItems:"center",gap:8}}>
              <span>{cover.emoji||"🎉"}</span><span>Cover Slide</span>
            </div>
            <div className="builder-aside-item-sub" style={{fontSize:11,color:T.mut,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{cover.title||"Untitled"}</div>
          </div>
          <div className="builder-aside-sec" style={{marginBottom:12}}>Rounds</div>
          {rounds.map((r,i)=>(
            <div key={r.id} className="builder-aside-item" onClick={()=>{setActiveRound(i);setShowRoundSettings(false);setEditingQ(null)}} style={{background:i===activeRound?"#1e1e45":"transparent",border:i===activeRound?`1px solid ${T.acc}44`:"1px solid transparent"}}>
              <div style={{fontSize:14,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
                <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{r.emoji} {r.name}</span>
                {rounds.length>1&&<span onClick={e=>{e.stopPropagation();deleteRound(i)}} style={{fontSize:11,color:T.mut,cursor:"pointer",flexShrink:0}}>✕</span>}
              </div>
              <div className="builder-aside-item-sub" style={{fontSize:11,color:T.mut,marginTop:2}}>{r.questions.length} questions · {r.questions.reduce((s,q)=>s+maxPoints(q,r),0)} pts</div>
            </div>
          ))}
          <div className="builder-newround">
            {showAddRound?(
              <div><Inp value={newRoundName} onChange={setNewRoundName} placeholder="Round name..."/><div style={{display:"flex",gap:6,marginTop:6}}><Btn onClick={addRound} style={{fontSize:12,padding:"6px 14px",flex:1}}>Add</Btn><Btn onClick={()=>setShowAddRound(false)} variant="ghost" style={{fontSize:12,padding:"6px 14px"}}>✕</Btn></div></div>
            ):(
              <button onClick={()=>setShowAddRound(true)} className="builder-newround-btn">+ Add Round</button>
            )}
          </div>
        </div>

        {/* Edit area */}
        <div className="builder-main">
          {activeRound===-1?(<>
            <h3 style={{fontFamily:dFont,fontSize:26,margin:"0 0 6px"}}><GT>Cover Slide</GT></h3>
            <p style={{color:T.mut,fontSize:13,marginBottom:20}}>This is the first slide your audience sees when you start the game.</p>
            <div style={{...cSty,maxWidth:560}}>
              <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Title</label><Inp value={cover.title} onChange={v=>updateCover({title:v})} placeholder="Welcome to Trivia Night"/></div>
              <div style={{marginBottom:12}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Subtitle (optional)</label><Inp value={cover.subtitle||""} onChange={v=>updateCover({subtitle:v})} placeholder="An evening of questionable knowledge"/></div>
              <div style={{marginBottom:12,display:"flex",gap:10}}>
                <div style={{flex:"0 0 120px"}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Emoji</label><Inp value={cover.emoji||""} onChange={v=>updateCover({emoji:v})} placeholder="🎉" style={{fontSize:24,textAlign:"center"}}/></div>
                <div style={{flex:1,paddingTop:18,fontSize:12,color:T.mut,lineHeight:1.5}}>Tip: open your OS emoji picker (Win+. on Windows, ⌃⌘Space on Mac) and paste any emoji.</div>
              </div>
              <ImagePicker label="Cover image / GIF" value={cover.image||""} onChange={v=>updateCover({image:v})}/>
            </div>
          </>):round&&(<>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <h3 style={{fontFamily:dFont,fontSize:26,margin:0}}>{round.emoji} {round.name}</h3>
              <button onClick={()=>setShowRoundSettings(s=>!s)} style={{background:"#1a1a3e",border:`1px solid ${T.cb}`,color:T.mut,borderRadius:10,padding:"6px 12px",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,transition:"all .15s"}}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.color=T.txt}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.cb;e.currentTarget.style.color=T.mut}}>
                {showRoundSettings?"▴ Round Settings":"⚙ Round Settings"}
              </button>
            </div>
            {showRoundSettings&&(
              <div style={{...cSty,marginBottom:20,background:"#0d0d25",border:`1px solid ${T.acc}33`}}>
                <div style={{display:"flex",gap:10,marginBottom:10,flexWrap:"wrap"}}>
                  <div style={{flex:"1 1 200px",minWidth:160}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Round Name</label><Inp value={round.name||""} onChange={v=>updateRound({name:v})} placeholder="Round name"/></div>
                  <div style={{flex:"0 0 100px"}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Emoji</label><Inp value={round.emoji||""} onChange={v=>updateRound({emoji:v})} placeholder="❓" style={{fontSize:22,textAlign:"center"}}/></div>
                  <div style={{flex:"0 0 130px"}}>
                    <label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Points / question</label>
                    <Inp type="number" value={round.pointsPerQuestion??1} onChange={v=>{const n=parseInt(v,10);updateRound({pointsPerQuestion:Number.isFinite(n)&&n>=0?n:1})}} placeholder="1" style={{textAlign:"center"}}/>
                  </div>
                </div>
                <div style={{fontSize:11,color:T.mut,marginBottom:10,lineHeight:1.5}}>
                  Each correct text/choice/range answer in this round is worth <b style={{color:T.gold}}>{roundPts(round)}</b> pt{roundPts(round)===1?"":"s"}. Music questions split this across artist + song, so each music question is worth up to <b style={{color:T.gold}}>{roundPts(round)*2}</b> pts.
                </div>
                <ImagePicker label="Round title image / GIF (shown on round intro)" value={round.image||""} onChange={v=>updateRound({image:v})}/>
              </div>
            )}
            {round.questions.map((q,qi)=>(
              <div key={q.id} style={{...cSty,marginBottom:12,cursor:"pointer"}} onClick={()=>setEditingQ(editingQ===qi?null:qi)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:11,color:T.acc,fontWeight:700,marginRight:8}}>Q{qi+1}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,marginRight:8,background:typeBg(q.type),color:typeColor(q.type)}}>{typeLabel(q.type)}</span>
                    <span style={{fontSize:10,color:T.gold}}>({maxPoints(q,round)} pt{maxPoints(q,round)===1?"":"s"})</span>
                    {q.type==="music"&&q.ytUrl&&extractYTId(q.ytUrl)&&<span style={{fontSize:10,padding:"2px 8px",borderRadius:6,background:"#FF6B9D22",color:T.pink,marginLeft:4}}>YT ✓</span>}
                    <div style={{fontSize:14,marginTop:6,lineHeight:1.5}}>{q.text||<span style={{color:T.mut,fontStyle:"italic"}}>No question text</span>}</div>
                    <div style={{fontSize:12,color:T.grn,marginTop:4}}>
                      {q.type==="music"?`✓ ${q.artist||"?"} — ${q.songTitle||"?"}`:`✓ ${q.answer||"No answer set"}`}
                    </div>
                  </div>
                  <span onClick={e=>{e.stopPropagation();deleteQ(qi)}} style={{fontSize:12,color:T.mut,cursor:"pointer",padding:4}}>🗑</span>
                </div>

                {editingQ===qi&&(
                  <div style={{marginTop:16,paddingTop:16,borderTop:`1px solid ${T.cb}`}} onClick={e=>e.stopPropagation()}>
                    {/* Type selector */}
                    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
                      {["text","choice","range","music"].map(t=>(
                        <button key={t} onClick={()=>updateQ(qi,{type:t})} style={{...bBtn,fontSize:12,padding:"6px 14px",borderRadius:8,background:q.type===t?T.acc:"transparent",border:`1px solid ${q.type===t?T.acc:T.cb}`,color:q.type===t?"#fff":T.mut}}>
                          {typeLabel(t)}
                        </button>
                      ))}
                    </div>

                    {/* Question text */}
                    <div style={{marginBottom:10}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Question text</label><Inp multiline value={q.text} onChange={v=>updateQ(qi,{text:v})} placeholder="Enter question..."/></div>

                    {/* Type-specific fields */}
                    {q.type==="music"&&(<>
                      <div style={{display:"flex",gap:10,marginBottom:10}}>
                        <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Artist (1 pt)</label><Inp value={q.artist||""} onChange={v=>updateQ(qi,{artist:v})} placeholder="Artist name"/></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Song Title (1 pt)</label><Inp value={q.songTitle||""} onChange={v=>updateQ(qi,{songTitle:v})} placeholder="Song title"/></div>
                      </div>
                      {/* YouTube fields — only for music */}
                      <div style={{marginTop:8,paddingTop:12,borderTop:`1px solid ${T.cb}`}}>
                        <div style={{fontSize:12,fontWeight:700,color:T.pink,marginBottom:8}}>🎵 Audio Clip (YouTube)</div>
                        <div style={{marginBottom:8}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>YouTube URL or Video ID</label><Inp value={q.ytUrl||""} onChange={v=>updateQ(qi,{ytUrl:v})} placeholder="https://youtube.com/watch?v=..."/></div>
                        <div style={{display:"flex",gap:10}}>
                          <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Start (e.g. 1:23)</label><Inp value={q.ytStart||""} onChange={v=>updateQ(qi,{ytStart:v})} placeholder="0:00"/></div>
                          <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>End (e.g. 1:45)</label><Inp value={q.ytEnd||""} onChange={v=>updateQ(qi,{ytEnd:v})} placeholder="0:30"/></div>
                        </div>
                        {q.ytUrl&&extractYTId(q.ytUrl)&&<div style={{marginTop:8,fontSize:12,color:T.grn}}>✓ ID: {extractYTId(q.ytUrl)}{q.ytStart&&` · ${q.ytStart}`}{q.ytEnd&&` → ${q.ytEnd}`}</div>}
                        {q.ytUrl&&!extractYTId(q.ytUrl)&&<div style={{marginTop:8,fontSize:12,color:T.pink}}>✗ Could not parse URL</div>}
                      </div>
                    </>)}

                    {q.type==="choice"&&<div style={{marginBottom:10}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Options (comma-separated)</label><Inp value={(q.options||[]).join(", ")} onChange={v=>updateQ(qi,{options:v.split(",").map(s=>s.trim()).filter(Boolean)})} placeholder="Option A, Option B, ..."/></div>}

                    {q.type!=="music"&&<div style={{marginBottom:10}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Answer</label><Inp value={q.answer||""} onChange={v=>updateQ(qi,{answer:v})} placeholder="Correct answer..."/></div>}

                    {q.type==="range"&&(
                      <div style={{display:"flex",gap:10,marginBottom:10}}>
                        <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Min</label><Inp type="number" value={q.min||""} onChange={v=>updateQ(qi,{min:parseFloat(v)})} placeholder="Min"/></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Max</label><Inp type="number" value={q.max||""} onChange={v=>updateQ(qi,{max:parseFloat(v)})} placeholder="Max"/></div>
                        <div style={{flex:1}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Display</label><Inp value={q.display||""} onChange={v=>updateQ(qi,{display:v})} placeholder="e.g. $35k"/></div>
                      </div>
                    )}

                    {q.type!=="music"&&<div style={{marginBottom:10}}><label style={{fontSize:11,color:T.mut,display:"block",marginBottom:4}}>Hint (optional)</label><Inp value={q.hint||""} onChange={v=>updateQ(qi,{hint:v})} placeholder="Optional hint..."/></div>}

                    {/* Images (optional) */}
                    <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.cb}`}}>
                      <div style={{fontSize:12,fontWeight:700,color:T.acc,marginBottom:8}}>🖼 Images (optional)</div>
                      <ImagePicker label="Question slide image / GIF" value={q.image||""} onChange={v=>updateQ(qi,{image:v})}/>
                      <ImagePicker label="Answer slide image / GIF" value={q.answerImage||""} onChange={v=>updateQ(qi,{answerImage:v})}/>
                    </div>
                  </div>
                )}
              </div>
            ))}
            <button onClick={addQuestion} style={{width:"100%",padding:16,background:"none",border:`2px dashed ${T.cb}`,borderRadius:16,color:T.mut,cursor:"pointer",fontFamily:dFont,fontSize:16,transition:"all .2s"}}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=T.cb}>+ Add Question</button>
          </>)}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  HOST LOBBY
// ═══════════════════════════════════════════
function HostLobby({rounds,gameCode,players,onStart,onBack}){
  const totalPts=rounds.reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q,r),0),0);
  const totalQ=rounds.reduce((s,r)=>s+r.questions.length,0);
  const url=gameUrl(gameCode);
  const[copied,setCopied]=useState(false);
  function copyUrl(){
    try{
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(()=>setCopied(false),1500);
    }catch{}
  }
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{globalCSS}{`@keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}`}</style>
      <button onClick={onBack} style={{position:"absolute",top:20,left:20,background:"none",border:"none",color:T.mut,cursor:"pointer",fontFamily:font}}>← Back</button>
      <div style={{fontSize:48,marginBottom:8}}>🎮</div>
      <h2 style={{fontFamily:dFont,fontSize:32,margin:"0 0 8px"}}><GT>Game Lobby</GT></h2>
      <p style={{color:T.mut,fontSize:14,marginBottom:24}}>{rounds.length} rounds · {totalQ} questions · {totalPts} total pts</p>

      {/* Join section: QR + code + URL */}
      <div style={{...cSty,marginBottom:24,width:"100%",maxWidth:560,display:"flex",gap:24,alignItems:"center",flexWrap:"wrap",justifyContent:"center"}}>
        <div style={{padding:8,background:"#0d0d25",borderRadius:12,border:`1px solid ${T.cb}`,flexShrink:0}}>
          <QRDisplay text={url} size={176} color="#E8E8F0" bg="#0d0d25"/>
        </div>
        <div style={{flex:"1 1 220px",minWidth:200,textAlign:"center"}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:T.mut,marginBottom:6}}>Join Code</div>
          <div style={{fontFamily:dFont,fontSize:52,letterSpacing:8,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",lineHeight:1}}>{gameCode}</div>
          <div style={{fontSize:11,color:T.mut,marginTop:10,wordBreak:"break-all",fontFamily:font}}>{url}</div>
          <button onClick={copyUrl} style={{marginTop:10,padding:"6px 14px",borderRadius:8,background:copied?`${T.grn}33`:`${T.acc}22`,border:`1px solid ${copied?T.grn:T.acc}44`,color:copied?T.grn:T.acc,cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600}}>
            {copied?"✓ Copied!":"📋 Copy Link"}
          </button>
          <div style={{fontSize:11,color:T.mut,marginTop:8,lineHeight:1.4}}>Players: scan the QR or open the link.</div>
        </div>
      </div>

      <div style={{...cSty,marginBottom:24,minWidth:320,width:"100%",maxWidth:560}}>
        <div style={{fontSize:12,color:T.mut,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.grn,animation:"pulse 2s infinite"}}/>{players.length} player{players.length!==1?"s":""} connected
        </div>
        {players.length===0?<div style={{fontSize:14,color:T.mut,fontStyle:"italic"}}>Waiting for players... or start solo!</div>:
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{players.map(p=><span key={p.id} style={{padding:"6px 14px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,fontSize:13,fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}>{p.avatar&&<span style={{fontSize:16,lineHeight:1}}>{p.avatar}</span>}{p.name}</span>)}</div>}
      </div>
      <Btn onClick={onStart} variant="gold" style={{fontSize:18,padding:"16px 48px"}}>🚀 Start Game</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════
//  ALBIE — headshot + emoji reactions (host display)
// ═══════════════════════════════════════════
const ALBIE_ENABLED=true;
const ALBIE_IMG="/albie.png";
const ALBIE_FOODS=["🍖","🥩","🍗","🦴","🥓","🍕","🌭","🍔","🥪","🧀","🍪","🍩","🥞","🍎","🍌","🥕"];
const ALBIE_TOYS=["🎾","⚽","🏀","🏈","⚾","🥎","🪀","🧸","🎯","🏓","🏸","🥏","🪁","🛼","🏐","🎱"];

function albiePick(list,seed){
  return list[Math.abs(Math.floor(seed))%list.length];
}

function AlbieDog({gameCode}){
  const[actionState,setActionState]=useState(null);

  useEffect(()=>{
    if(!ALBIE_ENABLED||!gameCode)return;
    let lastAt=0,firstFetch=true,cancelled=false;
    const poll=async()=>{
      if(cancelled)return;
      const a=await storageGet(`game:${gameCode}:albie`,true);
      if(a&&typeof a.at==="number"){
        if(firstFetch){lastAt=a.at;firstFetch=false;return;}
        if(a.at>lastAt){
          lastAt=a.at;
          setActionState({type:a.action,by:a.by||"",avatar:a.avatar||"",at:a.at});
        }
      }else if(firstFetch){firstFetch=false}
    };
    poll();
    const iv=setInterval(poll,700);
    return()=>{cancelled=true;clearInterval(iv)};
  },[gameCode]);

  useEffect(()=>{
    if(!ALBIE_ENABLED||!actionState)return;
    const t=setTimeout(()=>setActionState(null),2600);
    return()=>clearTimeout(t);
  },[actionState]);

  if(!ALBIE_ENABLED)return null;

  const action=actionState?.type||null;
  const actionKey=actionState?`${actionState.type}-${actionState.at}`:"idle";
  const propEmoji=actionState
    ?action==="feed"?albiePick(ALBIE_FOODS,actionState.at)
    :action==="play"?albiePick(ALBIE_TOYS,actionState.at)
    :null
    :null;

  const albieUI=(
    <div className="albie-host-anchor" style={{
      position:"fixed",bottom:88,right:20,zIndex:150,pointerEvents:"none",
      display:"flex",flexDirection:"column",alignItems:"flex-end",
    }}>
      <style>{`
        @keyframes albie-breathe{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
        @keyframes albie-caption{0%{opacity:0;transform:translateY(8px)}15%{opacity:1;transform:translateY(0)}85%{opacity:1}100%{opacity:0;transform:translateY(-4px)}}
        @keyframes albie-pat{
          0%,100%{transform:translate(-50%,0) rotate(-18deg) scaleX(-1)}
          50%{transform:translate(-50%,10px) rotate(8deg) scaleX(-1)}
        }
        @keyframes albie-nom{
          0%,100%{transform:translate(-50%,0) scale(1)}
          20%{transform:translate(-50%,4px) scale(.88)}
          40%{transform:translate(-50%,0) scale(1.12)}
          60%{transform:translate(-50%,3px) scale(.9)}
          80%{transform:translate(-50%,0) scale(1.08)}
        }
        @keyframes albie-chomp{
          0%,100%{transform:translateY(0)}
          25%{transform:translateY(2px)}
          50%{transform:translateY(0)}
          75%{transform:translateY(2px)}
        }
        @keyframes albie-play-bounce{
          0%,100%{transform:translate(calc(-50% - 52px),4px)}
          12.5%{transform:translate(calc(-50% - 39px),-6px)}
          25%{transform:translate(calc(-50% - 26px),-11px)}
          37.5%{transform:translate(calc(-50% - 13px),-13px)}
          50%{transform:translate(calc(-50% + 52px),4px)}
          62.5%{transform:translate(calc(-50% + 39px),-6px)}
          75%{transform:translate(calc(-50% + 26px),-11px)}
          87.5%{transform:translate(calc(-50% + 13px),-13px)}
        }
        .albie-head-img.albie-idle{animation:albie-breathe 2.8s ease-in-out infinite}
        .albie-head-img.albie-chomp{animation:albie-chomp .35s ease-in-out infinite}
      `}</style>

      {actionState&&(actionState.by||actionState.avatar)&&(
        <div key={`cap-${actionKey}`} style={{
          fontFamily:dFont,fontSize:11,color:T.gold,
          background:"#0d0d25cc",border:`1px solid ${T.gold}55`,
          borderRadius:10,padding:"4px 10px",marginBottom:6,
          whiteSpace:"nowrap",letterSpacing:.5,
          animation:"albie-caption 2.6s ease-in-out forwards",
        }}>
          {actionState.avatar&&<span style={{marginRight:6}}>{actionState.avatar}</span>}
          {actionState.by||"Someone"} {action==="feed"?"fed":action==="pet"?"petted":"played with"} Albie!
        </div>
      )}

      <div style={{position:"relative",padding:"10px 14px 8px"}}>
        <div aria-hidden style={{
          position:"absolute",inset:0,borderRadius:16,zIndex:0,
          background:"linear-gradient(180deg,#151530f5,#0d0d25f5)",
          border:`1px solid ${T.cb}`,boxShadow:"0 8px 32px #000000aa",
        }}/>
        <div key={actionKey} style={{
          position:"relative",zIndex:1,width:168,minHeight:168,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <div style={{position:"relative",width:148}}>
            <img
              src={ALBIE_IMG}
              alt="Albie"
              className={`albie-head-img ${action==="feed"?"albie-chomp":"albie-idle"}`}
              style={{
                width:"100%",height:"auto",display:"block",background:"transparent",
                filter:"drop-shadow(0 6px 14px rgba(0,0,0,.45))",
              }}
            />

            {action==="pet"&&(
              <span key={`pat-${actionKey}`} style={{
                position:"absolute",top:"2%",left:"52%",
                fontSize:36,lineHeight:1,pointerEvents:"none",
                animation:"albie-pat .45s ease-in-out infinite",
                filter:"drop-shadow(0 2px 4px #00000066)",
              }}>👋</span>
            )}

            {action==="feed"&&propEmoji&&(
              <span key={`food-${actionKey}`} style={{
                position:"absolute",bottom:"calc(18% - 40px)",left:"calc(50% + 20px)",
                fontSize:34,lineHeight:1,pointerEvents:"none",
                animation:"albie-nom .5s ease-in-out infinite",
              }}>{propEmoji}</span>
            )}

            {action==="play"&&propEmoji&&(
              <span key={`toy-${actionKey}`} style={{
                position:"absolute",top:"calc(22% + 80px)",left:"50%",
                fontSize:32,lineHeight:1,pointerEvents:"none",
                animation:"albie-play-bounce 1.8s ease-in-out infinite",
              }}>{propEmoji}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if(typeof document==="undefined") return null;
  return createPortal(albieUI,document.body);
}

function AlbieActions({gameCode,playerName,avatar}){
  const cooldownRef=useRef(0);
  if(!ALBIE_ENABLED)return null;
  // Rate-limit clicks so a player can't spam-lock Albie's animation.
  function trigger(action){
    const now=Date.now();
    if(now<cooldownRef.current)return;
    cooldownRef.current=now+800;
    storageSet(`game:${gameCode}:albie`,{action,at:now,by:playerName||"",avatar:avatar||""},true);
  }
  const btn=(emoji,label,key,color)=>(
    <button key={key} onClick={()=>trigger(key)} style={{
      padding:"10px 6px",borderRadius:12,
      background:"#1a1a3e",border:`1px solid ${color}44`,
      color:T.txt,fontFamily:font,fontSize:12,fontWeight:600,
      cursor:"pointer",transition:"all .15s",
      display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:0,
    }}
    onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.background=`${color}11`}}
    onMouseLeave={e=>{e.currentTarget.style.borderColor=`${color}44`;e.currentTarget.style.background="#1a1a3e"}}
    onMouseDown={e=>{e.currentTarget.style.transform="scale(.96)"}}
    onMouseUp={e=>{e.currentTarget.style.transform="scale(1)"}}
    >
      <span className="albie-action-emoji" style={{fontSize:22,lineHeight:1}}>{emoji}</span>
      <span className="albie-action-label">{label}</span>
    </button>
  );
  return (
    <div className="player-albie-bar" style={{
      flexShrink:0,padding:"8px 12px",
      paddingBottom:"max(10px, env(safe-area-inset-bottom))",
      borderTop:`1px solid ${T.cb}`,background:"#0d0d25",
    }}>
      <style>{`
        .player-albie-bar .albie-action-label{display:block}
        @media (max-width:380px){
          .player-albie-bar .albie-action-label{font-size:10px}
          .player-albie-bar .albie-action-emoji{font-size:18px!important}
        }
      `}</style>
      <div style={{fontSize:10,color:T.mut,textAlign:"center",marginBottom:6,letterSpacing:1.5,textTransform:"uppercase",fontWeight:600}}>
        🐶 Say hi to Albie
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {btn("🍖","Feed Albie","feed",T.gold)}
        {btn("👋","Pet Albie","pet",T.pink)}
        {btn("🎾","Play with Albie","play",T.grn)}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  SLIDE NAVIGATOR MODAL
// ═══════════════════════════════════════════
function SlideNavModal({slides,slideIndex,onJump,onClose}){
  const scrollRef=useRef(null);
  const itemRefs=useRef([]);
  // Walk backwards from current slide to find the nearest section header (cover/round-title/divider/results).
  const anchorIdx=(()=>{
    for(let i=slideIndex;i>=0;i--){
      const t=slides[i]?.type;
      if(t==="cover"||t==="round-title"||t==="divider"||t==="leaderboard"||t==="results") return i;
    }
    return 0;
  })();

  useEffect(()=>{
    // Defer until after layout so offsetTop is correct.
    const id=requestAnimationFrame(()=>{
      const container=scrollRef.current;
      const target=itemRefs.current[anchorIdx];
      if(container&&target){
        const top=target.offsetTop-container.offsetTop;
        container.scrollTop=Math.max(0,top-4);
      }
    });
    return ()=>cancelAnimationFrame(id);
  },[anchorIdx]);

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div ref={scrollRef} style={{...cSty,maxWidth:520,width:"100%",maxHeight:"80vh",overflowY:"auto",border:`1px solid ${T.acc}44`,position:"relative"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,position:"sticky",top:-24,padding:"24px 24px 12px",margin:"-24px -24px 4px",background:T.card,zIndex:2}}>
          <h3 style={{fontFamily:dFont,fontSize:20,margin:0}}><GT>Jump to Slide</GT></h3>
          <button onClick={onClose} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:18}}>✕</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {slides.map((s,i)=>{
            const isCurrent=i===slideIndex;
            let label="",icon="",section="";
            if(s.type==="cover"){
              icon=s.cover?.emoji||"🎉"; label=s.cover?.title||"Cover Slide"; section="cover";
            }else if(s.type==="round-title"){
              icon=s.round?.emoji||"📋";
              label=s.phase==="questions"?`${s.round?.name}`:`${s.round?.name} — Answers`;
              section=s.phase==="questions"?"question":"answer";
            }else if(s.type==="question"){
              icon=""; label=`  Q${s.questionIdx+1}: ${(s.question?.text||"").slice(0,50)}${(s.question?.text||"").length>50?"…":""}`;
              section="question";
            }else if(s.type==="answer"){
              icon=""; label=`  A${s.questionIdx+1}: ${(s.question?.text||"").slice(0,50)}${(s.question?.text||"").length>50?"…":""}`;
              section="answer";
            }else if(s.type==="divider"){
              icon="📝"; label="Answer Time!"; section="divider";
            }else if(s.type==="leaderboard"){
              icon="📊"; label="Halfway Standings"; section="leaderboard";
            }else if(s.type==="results"){
              icon="🏆"; label="Final Scores"; section="results";
            }
            const isHeader=s.type==="cover"||s.type==="round-title"||s.type==="divider"||s.type==="leaderboard"||s.type==="results";
            const sColor=section==="answer"?T.grn:section==="divider"?T.gold:section==="leaderboard"?T.gold:section==="results"?T.gold:section==="cover"?T.gold:T.txt;
            return (
              <button key={i} ref={el=>itemRefs.current[i]=el} onClick={()=>onJump(i)} style={{
                display:"flex",alignItems:"center",gap:8,padding:isHeader?"10px 12px":"6px 12px",
                background:isCurrent?`${T.acc}22`:isHeader?"#1a1a3e":"transparent",
                border:isCurrent?`1px solid ${T.acc}66`:"1px solid transparent",
                borderRadius:10,cursor:"pointer",textAlign:"left",width:"100%",
                fontFamily:isHeader?dFont:font,fontSize:isHeader?14:12,
                color:isCurrent?T.acc:isHeader?sColor:T.mut,
                fontWeight:isHeader?700:400,transition:"all .1s",
                marginTop:isHeader&&i>0?8:0,
              }}
              onMouseEnter={e=>{if(!isCurrent)e.currentTarget.style.background="#1e1e45"}}
              onMouseLeave={e=>{if(!isCurrent)e.currentTarget.style.background=isHeader?"#1a1a3e":"transparent"}}>
                {icon&&<span style={{fontSize:isHeader?16:12,width:22,textAlign:"center",flexShrink:0}}>{icon}</span>}
                {!icon&&<span style={{width:22,textAlign:"center",flexShrink:0,fontSize:10,color:T.mut}}>{i+1}</span>}
                <span style={{flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{label}</span>
                {isCurrent&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:`${T.acc}44`,color:T.acc,flexShrink:0}}>HERE</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  HOST PRESENTATION — two-click answer reveal
// ═══════════════════════════════════════════
function HostPresentation({cover,rounds,gameCode,players,slideIndex,setSlideIndex,onEnd}){
  const[showConfetti,setShowConfetti]=useState(false);
  const[answerRevealed,setAnswerRevealed]=useState(false);
  const[resultsRevealed,setResultsRevealed]=useState(false);
  const[overrides,setOverrides]=useState({}); // { "qId:pId": pointsAwarded }
  const[confirmEnd,setConfirmEnd]=useState(false);
  const[showNav,setShowNav]=useState(false);
  const slides=useMemo(()=>buildSlides(rounds,true,cover),[rounds,cover]);
  const slide=slides[slideIndex]||slides[0];
  const progress=((slideIndex+1)/slides.length)*100;
  const isAnswer=slide.type==="answer";
  const isResults=slide.type==="results";
  const isQuestion=slide.type==="question";

  useEffect(()=>{setAnswerRevealed(false);setResultsRevealed(false)},[slideIndex]);

  // Auto-advance: when on a question slide and every connected player has
  // submitted an answer, move on after a brief pause for the host to see.
  // Music questions are intentionally excluded — players are typing artist
  // AND song separately, and we don't want to bail before the slow typer
  // has finished the second field.
  // Compute allAnswered with useMemo so the boolean only changes when it
  // really transitions — otherwise the player-poll (every ~2s) would keep
  // clearing & re-arming the timeout and the advance would never fire.
  const isMusicQ=isQuestion&&slide.question?.type==="music";
  const allAnswered=useMemo(()=>{
    if(!isQuestion||!slide.question||isMusicQ||players.length===0)return false;
    const qId=slide.question.id;
    return players.every(p=>{
      const a=p.answers?.[qId];
      if(a===undefined||a===null)return false;
      if(typeof a==="object")return (a.artist&&a.artist.trim())||(a.songTitle&&a.songTitle.trim());
      return String(a).trim()!=="";
    });
  },[isQuestion,isMusicQ,slide.question?.id,players]);

  const[autoAdvancePending,setAutoAdvancePending]=useState(false);
  useEffect(()=>{
    if(!allAnswered){setAutoAdvancePending(false);return;}
    setAutoAdvancePending(true);
    const t=setTimeout(()=>{
      setSlideIndex(i=>Math.min(i+1,slides.length-1));
      setAutoAdvancePending(false);
    },2000);
    return()=>{clearTimeout(t)};
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[allAnswered,slideIndex,slides.length]);

  // Sync slide + reveal state to players (Firebase rejects `undefined` values, so omit them)
  useEffect(()=>{
    if(!gameCode||!slide) return;
    const payload={type:slide.type};
    if(slide.roundIdx!==undefined) payload.roundIdx=slide.roundIdx;
    if(slide.questionId!==undefined) payload.questionId=slide.questionId;
    if(slide.questionIdx!==undefined) payload.questionIdx=slide.questionIdx;
    if(slide.phase!==undefined) payload.phase=slide.phase;
    if(slide.pairIdx!==undefined) payload.pairIdx=slide.pairIdx;
    if(slide.type==="answer") payload.answerRevealed=answerRevealed;
    storageSet(`game:${gameCode}:state`,payload,true);
  },[gameCode,slide,slideIndex,answerRevealed]);

  // Sync host score overrides so player totals match
  useEffect(()=>{
    if(gameCode) storageSet(`game:${gameCode}:overrides`,overrides,true);
  },[gameCode,overrides]);

  function getPoints(q, playerId, playerAnswer, round) {
    return getEffectivePoints(q, playerId, playerAnswer, overrides, round);
  }

  // Override cycles through the natural increments for that question:
  //   text/choice/range:   0 -> base -> 0
  //   music:               0 -> base -> 2*base -> 0
  function toggleOverride(q, playerId, playerAnswer, round) {
    const key = `${q.id}:${playerId}`;
    const current = key in overrides ? overrides[key] : scoreAnswer(q, playerAnswer, round);
    const base = roundPts(round);
    const mp = maxPoints(q, round);
    const step = base > 0 ? base : 1;
    let next = current + step;
    if (next > mp) next = 0;
    setOverrides(prev => ({ ...prev, [key]: next }));
  }

  const totalPts=rounds.reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q,r),0),0);
  const scores=useMemo(()=>{
    return players.map(p=>{
      let score=0;
      rounds.forEach(r=>r.questions.forEach(q=>{score+=getEffectivePoints(q,p.id,p.answers?.[q.id],overrides,r)}));
      return{...p,score};
    }).sort((a,b)=>b.score-a.score);
  },[players,rounds,overrides]);

  useEffect(()=>{if(isResults&&resultsRevealed){setShowConfetti(true);const t=setTimeout(()=>setShowConfetti(false),4000);return()=>clearTimeout(t)}},[isResults,resultsRevealed]);

  // Keyboard/click nav with answer + results reveal logic
  const handleAdvance=useCallback(()=>{
    if(isAnswer&&!answerRevealed){setAnswerRevealed(true);return;}
    if(isResults&&!resultsRevealed){setResultsRevealed(true);return;}
    setSlideIndex(i=>Math.min(i+1,slides.length-1));
  },[isAnswer,answerRevealed,isResults,resultsRevealed,slides.length]);

  const handleBack=useCallback(()=>{
    if(isAnswer&&answerRevealed){setAnswerRevealed(false);return;}
    if(isResults&&resultsRevealed){setResultsRevealed(false);return;}
    setSlideIndex(i=>Math.max(i-1,0));
  },[isAnswer,answerRevealed,isResults,resultsRevealed]);

  useEffect(()=>{
    const handler=(e)=>{
      if(e.key==="ArrowRight"||e.key===" "){e.preventDefault();handleAdvance();}
      if(e.key==="ArrowLeft"){e.preventDefault();handleBack();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[handleAdvance,handleBack]);

  const bgs=["radial-gradient(ellipse at 20% 50%,#4158D033 0%,transparent 60%)","radial-gradient(ellipse at 80% 30%,#C850C033 0%,transparent 60%)","radial-gradient(ellipse at 50% 80%,#43E97B22 0%,transparent 60%)"];
  const musicQ=slide.question?.type==="music"?slide.question:null;
  const musicYtId=musicQ?.ytUrl?extractYTId(musicQ.ytUrl):null;
  const hasYTQuestion=slide.type==="question"&&musicYtId;
  const hasYTAnswer=slide.type==="answer"&&musicYtId;

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,position:"relative",overflow:"hidden"}}>
      <style>{globalCSS}{`
        @keyframes slideIn{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glow{0%,100%{text-shadow:0 0 30px #C850C066}50%{text-shadow:0 0 60px #C850C0aa}}
        @keyframes revealPop{from{opacity:0;transform:scale(.7) rotate(-3deg)}to{opacity:1;transform:scale(1) rotate(0)}}
        @keyframes pulse{0%,100%{opacity:.6}50%{opacity:1}}
        /* Host slide container — bulletproof horizontal centering across screen sizes. */
        .host-slide-root{min-height:100vh;width:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 40px 100px;position:relative;z-index:10;animation:slideIn .5s ease;box-sizing:border-box}
        .host-slide-content{width:100%;display:flex;flex-direction:column;align-items:center;text-align:center}
        .host-slide-content>*{max-width:100%}
        @media (max-width:900px){.host-slide-root{padding:48px 20px 110px}}
        @media (max-width:600px){.host-slide-root{padding:40px 14px 110px}}
      `}</style>
      <Confetti active={showConfetti}/>
      <div style={{position:"absolute",inset:0,background:bgs[slideIndex%3],transition:"background 1s"}}/>

      {ALBIE_ENABLED&&<AlbieDog gameCode={gameCode}/>}

      {/* Progress */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:4,background:"#151530",zIndex:100}}>
        <div style={{height:"100%",width:`${progress}%`,background:T.grad,transition:"width .4s",borderRadius:"0 2px 2px 0"}}/>
      </div>

      {/* End Game Early button */}
      <button onClick={()=>setConfirmEnd(true)} style={{position:"fixed",top:16,right:20,zIndex:101,background:"#FF6B9D22",border:"1px solid #FF6B9D44",borderRadius:10,padding:"8px 16px",color:T.pink,cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,transition:"all .2s"}}
        onMouseEnter={e=>{e.currentTarget.style.background="#FF6B9D44"}} onMouseLeave={e=>{e.currentTarget.style.background="#FF6B9D22"}}>
        ✕ End Game
      </button>

      {/* End Game Confirmation */}
      {confirmEnd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={()=>setConfirmEnd(false)}>
          <div style={{...cSty,maxWidth:380,textAlign:"center",border:`1px solid ${T.pink}44`}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:36,marginBottom:12}}>🛑</div>
            <h3 style={{fontFamily:dFont,fontSize:22,margin:"0 0 8px",color:T.txt}}>End game early?</h3>
            <p style={{color:T.mut,fontSize:14,marginBottom:20}}>This will skip to final scores. You can't undo this.</p>
            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <Btn onClick={()=>setConfirmEnd(false)} variant="ghost" style={{padding:"10px 20px",fontSize:14}}>Cancel</Btn>
              <Btn onClick={()=>{setConfirmEnd(false);setSlideIndex(slides.length-1)}} variant="reveal" style={{padding:"10px 20px",fontSize:14}}>End & Show Scores</Btn>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",display:"flex",gap:12,zIndex:100}}>
        <Btn onClick={handleBack} variant="ghost" style={{padding:"10px 20px",fontSize:14}} disabled={slideIndex===0&&!(isAnswer&&answerRevealed)}>← Prev</Btn>
        <button onClick={()=>setShowNav(true)} style={{color:T.mut,fontSize:12,display:"flex",alignItems:"center",padding:"8px 16px",background:"#151530cc",border:`1px solid ${T.cb}`,borderRadius:10,cursor:"pointer",fontFamily:font,fontWeight:600,transition:"all .2s",backdropFilter:"blur(8px)"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.acc;e.currentTarget.style.color=T.txt}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.cb;e.currentTarget.style.color=T.mut}}>
          {slideIndex+1}/{slides.length} ▾
        </button>
        {isResults&&!resultsRevealed?(
          <Btn onClick={handleAdvance} variant="reveal" style={{padding:"10px 24px",fontSize:14}}>✨ Reveal Standings</Btn>
        ):isResults&&resultsRevealed?(
          <Btn onClick={onEnd} variant="gold" style={{padding:"10px 20px",fontSize:14}}>End Game 🏁</Btn>
        ):isAnswer&&!answerRevealed?(
          <Btn onClick={handleAdvance} variant="reveal" style={{padding:"10px 24px",fontSize:14}}>✨ Reveal Answer</Btn>
        ):(
          <Btn onClick={handleAdvance} style={{padding:"10px 20px",fontSize:14}} disabled={slideIndex>=slides.length-1}>Next →</Btn>
        )}
      </div>

      {/* Slide Navigator Modal — scrolls to current section on open */}
      {showNav&&(
        <SlideNavModal
          slides={slides}
          slideIndex={slideIndex}
          onJump={i=>{setSlideIndex(i);setShowNav(false)}}
          onClose={()=>setShowNav(false)}
        />
      )}

      {/* Slide — key changes only on slide change so reveal toggles don't remount
          the YTPlayer iframe (which would restart playback). The inner reveal
          blocks have their own pop animation. */}
      <div key={slideIndex} className="host-slide-root">

        {slide.type==="cover"&&(
          <div className="host-slide-content" style={{maxWidth:900,margin:"0 auto"}}>
            {slide.cover?.image&&<div style={{display:"flex",justifyContent:"center",marginBottom:24,width:"100%"}}><img src={slide.cover.image} alt="" style={{maxWidth:"min(640px,90%)",maxHeight:380,objectFit:"contain",borderRadius:24,border:`1px solid ${T.cb}`,boxShadow:"0 4px 40px #00000066"}}/></div>}
            {slide.cover?.emoji&&<div style={{fontSize:72,marginBottom:8}}>{slide.cover.emoji}</div>}
            <h1 style={{fontFamily:dFont,fontSize:"clamp(40px,8vw,72px)",margin:0,animation:"glow 3s infinite",lineHeight:1.1}}><GT>{slide.cover?.title||"TriviaHost"}</GT></h1>
            {slide.cover?.subtitle&&<p style={{color:T.mut,fontSize:20,marginTop:18}}>{slide.cover.subtitle}</p>}
          </div>
        )}

        {slide.type==="round-title"&&(
          <div className="host-slide-content" style={{maxWidth:900,margin:"0 auto"}}>
            {slide.round.image&&<div style={{display:"flex",justifyContent:"center",marginBottom:20,width:"100%"}}><img src={slide.round.image} alt="" style={{maxWidth:"min(520px,90%)",maxHeight:300,objectFit:"contain",borderRadius:20,border:`1px solid ${T.cb}`,boxShadow:"0 4px 30px #00000055"}}/></div>}
            <div style={{fontSize:80,marginBottom:16}}>{slide.round.emoji}</div>
            <div style={{fontSize:14,textTransform:"uppercase",letterSpacing:3,color:T.mut,marginBottom:12}}>
              {slide.phase==="questions"?`Round ${slide.roundIdx+1}`:`Round ${slide.roundIdx+1} — Answers`}
            </div>
            <h1 style={{fontFamily:dFont,fontSize:"clamp(32px,6vw,56px)",margin:0,animation:"glow 3s infinite"}}><GT>{slide.round.name}</GT></h1>
            <p style={{color:T.mut,marginTop:16,fontSize:18}}>{slide.round.questions.length} question{slide.round.questions.length!==1?"s":""} · {slide.round.questions.reduce((s,q)=>s+maxPoints(q,slide.round),0)} pts</p>
          </div>
        )}

        {slide.type==="question"&&(
          <div className="host-slide-content" style={{maxWidth:900,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:24,flexWrap:"wrap"}}>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,color:T.acc}}>{slide.round.emoji} {slide.round.name}</span>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.gold}22`,border:`1px solid ${T.gold}44`,color:T.gold}}>Q{slide.questionIdx+1} of {slide.round.questions.length}</span>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.pink}22`,border:`1px solid ${T.pink}44`,color:T.pink}}>{slide.question.type==="music"?`${maxPoints(slide.question,slide.round)} pts (Artist + Song)`:`${maxPoints(slide.question,slide.round)} pt${maxPoints(slide.question,slide.round)===1?"":"s"}`}</span>
            </div>
            <h2 style={{fontFamily:dFont,fontSize:"clamp(22px,3.6vw,38px)",lineHeight:1.3,margin:"0 0 24px",fontWeight:400}}>{slide.question.text}</h2>
            {slide.question.image&&<div style={{display:"flex",justifyContent:"center",marginBottom:16}}><img src={slide.question.image} alt="" style={{maxWidth:"min(560px,90%)",maxHeight:340,objectFit:"contain",borderRadius:16,border:`1px solid ${T.cb}`,boxShadow:"0 4px 30px #00000055"}}/></div>}
            {slide.question.hint&&!hasYTQuestion&&<p style={{color:T.pink,fontSize:16,fontStyle:"italic"}}>💡 {slide.question.hint}</p>}
            {hasYTQuestion&&<div style={{marginTop:8,marginBottom:16,display:"flex",justifyContent:"center"}}><YTPlayer key={`q-${slide.question.id}`} videoId={musicYtId} start={slide.question.ytStart} end={slide.question.ytEnd}/></div>}
            {slide.question.type==="choice"&&slide.question.options&&(
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:24}}>
                {slide.question.options.map((opt,i)=><div key={i} style={{padding:"14px 28px",borderRadius:14,background:T.card,border:`2px solid ${T.cb}`,fontSize:20,fontWeight:600,fontFamily:dFont}}>{String.fromCharCode(65+i)}. {opt}</div>)}
              </div>
            )}
            {players.length>0&&(()=>{
              const hasAnswered=p=>{
                const a=p.answers?.[slide.question.id];
                if(a===undefined||a===null)return false;
                if(typeof a==="object")return (a.artist&&a.artist.trim())||(a.songTitle&&a.songTitle.trim());
                return String(a).trim()!=="";
              };
              const answeredCount=players.filter(hasAnswered).length;
              const all=answeredCount===players.length;
              return (
                <div style={{marginTop:32,width:"100%",maxWidth:760,marginLeft:"auto",marginRight:"auto"}}>
                  <div style={{fontSize:11,color:all?T.grn:T.mut,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1.5}}>
                    <span>{answeredCount}/{players.length} answered</span>
                    {all&&autoAdvancePending&&<span style={{fontSize:10,padding:"3px 8px",borderRadius:6,background:`${T.grn}22`,border:`1px solid ${T.grn}44`,color:T.grn,animation:"pulse 1.5s infinite",letterSpacing:.5}}>auto-advancing…</span>}
                  </div>
                  {/* Player nameplates — gray while waiting, light up green once submitted */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
                    {players.map(p=>{
                      const done=hasAnswered(p);
                      return (
                        <span key={p.id} style={{
                          display:"inline-flex",alignItems:"center",gap:8,
                          padding:"8px 14px",borderRadius:12,
                          background:done?`${T.grn}1f`:"#0d0d25",
                          border:done?`1px solid ${T.grn}`:`1px solid ${T.cb}`,
                          color:done?T.grn:T.mut,
                          fontSize:14,fontWeight:600,
                          transition:"all .35s",
                          opacity:done?1:.7,
                          boxShadow:done?`0 0 16px ${T.grn}33`:"none",
                        }}>
                          {p.avatar&&<span style={{fontSize:16,lineHeight:1,filter:done?"none":"grayscale(.5)"}}>{p.avatar}</span>}
                          <span>{p.name}</span>
                          {done&&<span style={{fontSize:12,fontWeight:700}}>✓</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {slide.type==="answer"&&(
          <div className="host-slide-content" style={{maxWidth:1100,margin:"0 auto"}}>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20,flexWrap:"wrap"}}>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,color:T.acc}}>{slide.round.emoji} {slide.round.name}</span>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.grn}22`,border:`1px solid ${T.grn}44`,color:T.grn}}>Answer {slide.questionIdx+1}</span>
            </div>
            {/* Always show the question */}
            <h2 style={{fontFamily:dFont,fontSize:"clamp(20px,3vw,32px)",lineHeight:1.4,margin:"0 0 28px",fontWeight:400,color:T.txt,maxWidth:750,marginLeft:"auto",marginRight:"auto"}}>
              {slide.question.text}
            </h2>

            {/* Music clip auto-plays as audio when the answer slide loads.
                The video container becomes visible (without restarting playback)
                once the host clicks reveal. End timestamp is not enforced here —
                clip keeps playing until host stops or moves on. */}
            {hasYTAnswer&&(
              <div style={{display:"flex",justifyContent:"center",marginBottom:24}}>
                <YTPlayer
                  key={`a-${slide.question.id}`}
                  videoId={musicYtId}
                  start={slide.question.ytStart}
                  end={slide.question.ytEnd}
                  enforceEnd={false}
                  showVideo={answerRevealed}
                  autoStart={true}
                />
              </div>
            )}

            {/* Answer — only shown after reveal click */}
            {answerRevealed&&(
              <div style={{animation:"revealPop .6s cubic-bezier(.17,.67,.35,1.3)"}}>
                {slide.question.answerImage&&<div style={{display:"flex",justifyContent:"center",marginBottom:20}}><img src={slide.question.answerImage} alt="" style={{maxWidth:"min(560px,90%)",maxHeight:300,objectFit:"contain",borderRadius:16,border:`1px solid ${T.cb}`,boxShadow:"0 4px 30px #00000055"}}/></div>}
                {slide.question.type==="music"?(()=>{const sub=roundPts(slide.round);return (
                  <div style={{display:"inline-flex",flexDirection:"column",gap:12,alignItems:"center"}}>
                    <div style={{padding:"20px 40px",borderRadius:16,background:"linear-gradient(135deg,#43E97B22,#38F9D722)",border:`2px solid ${T.grn}`}}>
                      <div style={{fontSize:12,textTransform:"uppercase",letterSpacing:2.5,color:T.grn,marginBottom:6,fontWeight:800}}>🎤 Artist ({sub} pt{sub===1?"":"s"})</div>
                      <div style={{fontFamily:dFont,fontSize:36,color:T.grn}}>{slide.question.artist}</div>
                    </div>
                    <div style={{padding:"20px 40px",borderRadius:16,background:"linear-gradient(135deg,#43E97B22,#38F9D722)",border:`2px solid ${T.grn}`}}>
                      <div style={{fontSize:12,textTransform:"uppercase",letterSpacing:2.5,color:T.grn,marginBottom:6,fontWeight:800}}>🎵 Song Title ({sub} pt{sub===1?"":"s"})</div>
                      <div style={{fontFamily:dFont,fontSize:36,color:T.grn}}>{slide.question.songTitle}</div>
                    </div>
                  </div>
                );})():(
                  <div style={{display:"inline-block",padding:"24px 48px",borderRadius:20,background:"linear-gradient(135deg,#43E97B22,#38F9D722)",border:`2px solid ${T.grn}`}}>
                    <div style={{fontSize:12,textTransform:"uppercase",letterSpacing:2,color:T.grn,marginBottom:8}}>Answer</div>
                    <div style={{fontFamily:dFont,fontSize:42,color:T.grn}}>{slide.question.display||slide.question.answer}</div>
                  </div>
                )}

                {/* Player results with override — 2-column grid keeps long lists on-screen */}
                {players.length>0&&(
                  <div style={{marginTop:32,width:"100%",maxWidth:1100,marginLeft:"auto",marginRight:"auto"}}>
                    <div style={{fontSize:13,color:T.mut,marginBottom:12}}>Player Answers</div>
                    <div style={{display:"grid",gridTemplateColumns:players.length<=1?"1fr":"repeat(auto-fit,minmax(320px,1fr))",gap:8}}>
                      {players.map(p=>{
                        const ans=p.answers?.[slide.question.id];
                        const pts=getPoints(slide.question,p.id,ans,slide.round);
                        const mp=maxPoints(slide.question,slide.round);
                        const isOverridden=(`${slide.question.id}:${p.id}` in overrides);
                        const color=pts>=mp&&mp>0?T.grn:pts>0?T.gold:T.pink;
                        const icon=pts>=mp&&mp>0?"✓":pts>0?"½":"✗";
                        let display="";
                        if(slide.question.type==="music"&&ans&&typeof ans==="object") display=`${ans.artist||"—"} / ${ans.songTitle||"—"}`;
                        else if(ans) display=String(ans);
                        else display="No answer";
                        return <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:12,background:`${color}11`,border:`1px solid ${color}33`,transition:"all .2s",minWidth:0}}>
                          <span style={{
                            minWidth:44,height:36,borderRadius:10,border:`2px solid ${color}`,background:`${color}22`,
                            color,fontSize:14,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:dFont,flexShrink:0,padding:"0 6px",
                          }}>{pts}/{mp}</span>
                          <div style={{flex:1,textAlign:"left",minWidth:0}}>
                            <div style={{fontSize:14,fontWeight:600,color:T.txt,display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                              <span style={{flexShrink:0}}>{icon}</span>
                              {p.avatar&&<span style={{flexShrink:0,fontSize:16,lineHeight:1}}>{p.avatar}</span>}
                              <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</span>
                              {isOverridden&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:`${T.gold}33`,color:T.gold,fontWeight:700,flexShrink:0}}>OVR</span>}
                            </div>
                            <div style={{fontSize:12,color:T.mut,marginTop:2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{display}</div>
                          </div>
                          <button onClick={()=>toggleOverride(slide.question,p.id,ans,slide.round)} title="Cycle override: 0 → partial → full" style={{
                            padding:"6px 10px",borderRadius:10,border:`2px solid ${isOverridden?T.gold:T.cb}`,
                            background:isOverridden?`${T.gold}22`:"transparent",color:isOverridden?T.gold:T.mut,
                            fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:font,flexShrink:0,transition:"all .15s",
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=T.gold;e.currentTarget.style.color=T.gold}}
                          onMouseLeave={e=>{if(!isOverridden){e.currentTarget.style.borderColor=T.cb;e.currentTarget.style.color=T.mut}}}>
                            Override
                          </button>
                        </div>;
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!answerRevealed&&(
              <div style={{marginTop:24,color:T.mut,fontSize:15,fontStyle:"italic",animation:"glow 3s infinite"}}>
                Click "Reveal Answer" to show the answer...
              </div>
            )}
          </div>
        )}

        {slide.type==="divider"&&(
          <div className="host-slide-content" style={{maxWidth:900,margin:"0 auto"}}>
            <div style={{fontSize:80,marginBottom:16}}>📝</div>
            <h1 style={{fontFamily:dFont,fontSize:"clamp(32px,6vw,48px)",margin:0}}><GT>Answer Time!</GT></h1>
            <p style={{color:T.mut,fontSize:18,marginTop:16}}>Let's see how everyone did...</p>
          </div>
        )}

        {slide.type==="leaderboard"&&(
          <div className="host-slide-content" style={{maxWidth:700,margin:"0 auto"}}>
            <div style={{fontSize:56,marginBottom:8}}>📊</div>
            <h1 style={{fontFamily:dFont,fontSize:40,margin:"0 0 8px"}}><GT>Halfway Standings</GT></h1>
            <p style={{color:T.mut,fontSize:15,marginBottom:28}}>Rounds 1–{(slide.pairIdx+1)*2} · {totalPts} pts total so far</p>
            {scores.length===0?<p style={{color:T.mut}}>No players yet</p>:(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {scores.map((p,i)=>{
                  const pct=totalPts>0?(p.score/totalPts)*100:0;
                  const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
                  return <div key={p.id} style={{...cSty,display:"flex",alignItems:"center",gap:16,border:i===0?`2px solid ${T.gold}`:`1px solid ${T.cb}`,animation:`slideIn .5s ease ${i*.08}s both`}}>
                    <span style={{fontSize:i<3?28:16,minWidth:38,textAlign:"center",fontFamily:dFont}}>{medal}</span>
                    <div style={{flex:1,textAlign:"left",display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                      {p.avatar&&<span style={{fontSize:24,lineHeight:1,flexShrink:0}}>{p.avatar}</span>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:17,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                        <div style={{height:6,borderRadius:3,background:"#1a1a3e",marginTop:6,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:i===0?`linear-gradient(90deg,${T.gold},#FF9A44)`:T.grad,borderRadius:3,transition:"width 1s"}}/>
                        </div>
                      </div>
                    </div>
                    <div style={{fontFamily:dFont,fontSize:22,color:i===0?T.gold:T.txt}}>{p.score}<span style={{fontSize:13,color:T.mut}}>/{totalPts}</span></div>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}

        {slide.type==="results"&&(
          <div className="host-slide-content" style={{maxWidth:600,margin:"0 auto"}}>
            <div style={{fontSize:64,marginBottom:8}}>🏆</div>
            <h1 style={{fontFamily:dFont,fontSize:44,margin:"0 0 32px"}}><GT>Final Scores</GT></h1>
            {!resultsRevealed?(
              <div style={{color:T.mut,fontSize:16,fontStyle:"italic",animation:"glow 3s infinite",padding:"30px 0"}}>
                Drumroll please… click "Reveal Standings" to show the results.
              </div>
            ):scores.length===0?<p style={{color:T.mut}}>No players — host-only mode</p>:(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {scores.map((p,i)=>{
                  const pct=totalPts>0?(p.score/totalPts)*100:0;
                  const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
                  return <div key={p.id} style={{...cSty,display:"flex",alignItems:"center",gap:16,border:i===0?`2px solid ${T.gold}`:`1px solid ${T.cb}`,animation:`slideIn .5s ease ${i*.1}s both`}}>
                    <span style={{fontSize:i<3?32:18,minWidth:40,textAlign:"center",fontFamily:dFont}}>{medal}</span>
                    <div style={{flex:1,textAlign:"left",display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                      {p.avatar&&<span style={{fontSize:28,lineHeight:1,flexShrink:0}}>{p.avatar}</span>}
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontWeight:700,fontSize:18,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                        <div style={{height:6,borderRadius:3,background:"#1a1a3e",marginTop:6,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:i===0?`linear-gradient(90deg,${T.gold},#FF9A44)`:T.grad,borderRadius:3,transition:"width 1s"}}/>
                        </div>
                      </div>
                    </div>
                    <div style={{fontFamily:dFont,fontSize:24,color:i===0?T.gold:T.txt}}>{p.score}<span style={{fontSize:14,color:T.mut}}>/{totalPts}</span></div>
                  </div>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  AVATAR PICKER (player)
// ═══════════════════════════════════════════
const AVATAR_OPTIONS=["🎉","🚀","🦄","🐱","🐶","🦊","🐼","🐯","🐸","🐙","🦋","🐲","🦉","🐧","🐰","🦝","🌟","💎","👑","🌈","🍕","🎨","🎸","🎮"];
function AvatarPicker({value,onChange}){
  return (
    <div style={{...cSty,marginTop:20,width:"100%",textAlign:"left",padding:"16px 18px"}}>
      <div style={{fontSize:12,color:T.mut,marginBottom:10,textAlign:"center",letterSpacing:1,textTransform:"uppercase",fontWeight:600}}>Pick your avatar</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:6,marginBottom:12}}>
        {AVATAR_OPTIONS.map(e=>(
          <button key={e} onClick={()=>onChange(e)} style={{
            fontSize:22,padding:"6px 0",borderRadius:10,cursor:"pointer",lineHeight:1,
            background:value===e?`${T.acc}33`:"#0d0d25",
            border:value===e?`2px solid ${T.acc}`:`1px solid ${T.cb}`,
            transition:"all .15s",
          }}>{e}</button>
        ))}
      </div>
      <div style={{fontSize:11,color:T.mut,marginBottom:6,textAlign:"center"}}>or paste your own emoji</div>
      <Inp value={value} onChange={onChange} placeholder="🎲" style={{fontSize:22,textAlign:"center",padding:"8px 12px"}}/>
    </div>
  );
}

// ═══════════════════════════════════════════
//  PLAYER JOIN
// ═══════════════════════════════════════════
function PlayerJoin({onJoin,onBack,prefillCode=""}){
  const[code,setCode]=useState(prefillCode);const[name,setName]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  async function handleJoin(){
    if(!code.trim()||!name.trim()){setError("Enter both a code and your name");return;}
    setLoading(true);setError("");
    const codeUp=code.toUpperCase();
    const trimmedName=name.trim();
    const gd=await storageGet(`game:${codeUp}:host`,true);
    if(!gd){setError("Game not found — check the code!");setLoading(false);return;}
    // If a player with this (normalized) name already exists in the room,
    // rejoin under their id so their answers + avatar are preserved — even
    // when joining from a fresh browser or device with no local session.
    const keys=await storageList(`game:${codeUp}:player:`,true);
    let existingId=null;
    for(const k of keys){
      const p=await storageGet(k,true);
      if(p&&p.id&&p.name&&normalize(p.name)===normalize(trimmedName)){existingId=p.id;break;}
    }
    onJoin(codeUp,trimmedName,gd,existingId);
  }
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{globalCSS}</style>
      <button onClick={onBack} style={{position:"absolute",top:20,left:20,background:"none",border:"none",color:T.mut,cursor:"pointer",fontFamily:font}}>← Back</button>
      <div style={{fontSize:48,marginBottom:8}}>📱</div>
      <h2 style={{fontFamily:dFont,fontSize:32,margin:"0 0 32px"}}><GT>Join Game</GT></h2>
      <div style={{...cSty,maxWidth:380,width:"100%"}}>
        <div style={{marginBottom:16}}><label style={{fontSize:12,color:T.mut,display:"block",marginBottom:6}}>Game Code</label><Inp value={code} onChange={v=>setCode(v.toUpperCase())} placeholder="ABCD" style={{fontSize:28,textAlign:"center",letterSpacing:6,fontFamily:dFont}}/></div>
        <div style={{marginBottom:20}}><label style={{fontSize:12,color:T.mut,display:"block",marginBottom:6}}>Your Name</label><Inp value={name} onChange={setName} placeholder="Enter your name..."/></div>
        {error&&<div style={{fontSize:13,color:T.pink,marginBottom:12}}>{error}</div>}
        <Btn onClick={handleJoin} variant="gold" style={{width:"100%",fontSize:18}} disabled={loading}>{loading?"Connecting...":"Join Game →"}</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  PLAYER GAME — music type shows 2 inputs
// ═══════════════════════════════════════════
function PlayerGame({gameCode,playerName,playerId,initialGameData,onLeave}){
  const[gameData,setGameData]=useState(initialGameData);
  const[gameState,setGameState]=useState(null);
  const[overrides,setOverrides]=useState({});
  const[answers,setAnswers]=useState({});
  const[avatar,setAvatar]=useState("");
  const[currentInput,setCurrentInput]=useState("");
  const[musicArtist,setMusicArtist]=useState("");
  const[musicSong,setMusicSong]=useState("");

  // On mount: fetch any prior answers + avatar (rejoin) BEFORE we start
  // mirroring local state up. This avoids briefly overwriting a returning
  // player's data with empty defaults.
  const[joined,setJoined]=useState(false);
  useEffect(()=>{(async()=>{
    const prior=await storageGet(`game:${gameCode}:player:${playerId}`,true);
    const priorAnswers=prior&&prior.answers&&typeof prior.answers==="object"?prior.answers:{};
    const priorAvatar=prior&&typeof prior.avatar==="string"?prior.avatar:"";
    if(Object.keys(priorAnswers).length>0) setAnswers(priorAnswers);
    if(priorAvatar) setAvatar(priorAvatar);
    await storageSet(`game:${gameCode}:player:${playerId}`,{id:playerId,name:playerName,answers:priorAnswers,avatar:priorAvatar},true);
    setJoined(true);
  })()},[]);
  useEffect(()=>{
    const poll=async()=>{
      const st=await storageGet(`game:${gameCode}:state`,true);if(st)setGameState(st);
      const d=await storageGet(`game:${gameCode}:host`,true);if(d)setGameData(d);
      const ov=await storageGet(`game:${gameCode}:overrides`,true);if(ov)setOverrides(ov);
    };
    poll();const iv=setInterval(poll,1500);return()=>clearInterval(iv);
  },[gameCode]);
  useEffect(()=>{
    if(!joined) return;
    storageSet(`game:${gameCode}:player:${playerId}`,{id:playerId,name:playerName,answers,avatar},true);
  },[answers,avatar,joined]);

  const allQ=(gameData?.rounds||[]).flatMap(r=>r.questions.map(q=>({...q,roundName:r.name,roundEmoji:r.emoji})));
  const roundIndex=useMemo(()=>buildRoundIndex(gameData?.rounds||[]),[gameData]);
  let currentQ=null,phase="waiting";
  if(gameState){
    if(gameState.type==="question"){currentQ=allQ.find(q=>q.id===gameState.questionId);phase="question"}
    else if(gameState.type==="answer"){currentQ=allQ.find(q=>q.id===gameState.questionId);phase="answer"}
    else if(gameState.type==="results"){phase="results"}
  }
  const currentRound=currentQ?roundIndex[currentQ.id]:null;

  // Reset inputs when question changes
  const prevQRef=useRef(null);
  useEffect(()=>{
    if(currentQ&&currentQ.id!==prevQRef.current){setCurrentInput("");setMusicArtist("");setMusicSong("");prevQRef.current=currentQ.id}
  },[currentQ]);

  function submitAnswer(qId,answer){setAnswers(prev=>({...prev,[qId]:answer}));setCurrentInput("");setMusicArtist("");setMusicSong("");}
  const already=currentQ&&answers[currentQ.id];
  // Albie only exists on the host presentation screen (after Start Game).
  // `game:state` is written there — not in the lobby — so hide commands until then.
  const hostShowingAlbie=!!gameState;
  const showAlbie=ALBIE_ENABLED&&hostShowingAlbie&&!(phase==="question"&&!already);

  return(
    <div className="player-game-shell" style={{
      height:"100dvh",maxHeight:"100dvh",background:T.bg,fontFamily:font,color:T.txt,
      display:"flex",flexDirection:"column",overflow:"hidden",boxSizing:"border-box",
    }}>
      <style>{globalCSS}{`
        @keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}
        @supports not (height:100dvh){
          .player-game-shell{height:100vh!important;max-height:100vh!important}
        }
      `}</style>
      <div style={{flexShrink:0,padding:"12px 16px",borderBottom:`1px solid ${T.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
        <div style={{fontSize:13,color:T.mut,display:"flex",alignItems:"center",gap:6,minWidth:0}}>
          {avatar&&<span style={{fontSize:16,lineHeight:1,flexShrink:0}}>{avatar}</span>}
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{playerName}</span>
        </div>
        <div style={{fontFamily:dFont,fontSize:14,flexShrink:0}}><GT>GAME {gameCode}</GT></div>
        <button onClick={onLeave} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:12,fontFamily:font,flexShrink:0}}>Leave</button>
      </div>
      <div style={{
        flex:1,minHeight:0,overflowY:"auto",WebkitOverflowScrolling:"touch",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:showAlbie?"flex-start":"center",
        padding:showAlbie?"16px 16px 12px":"24px 16px",
      }}>

        {phase==="waiting"&&(()=>{
          let icon="⏳",msg="Waiting for host...",sub="";
          if(gameState){
            if(gameState.type==="divider"||(gameState.type==="round-title"&&gameState.phase==="answers")){
              icon="📝";msg="Waiting for the answers...";
            }else if(gameState.type==="leaderboard"){
              icon="📊";msg="Halfway standings!";sub="Check the host screen.";
            }else if(gameState.type==="round-title"&&gameState.phase==="questions"){
              icon="🎯";msg="Next round starting...";
            }else if(gameState.type==="cover"){
              icon="🎉";msg="Get ready — game starting!";
            }else{
              msg="Next question coming...";
            }
          }
          // Show the player their current score on the leaderboard slide.
          let myScoreBlock=null;
          if(gameState&&gameState.type==="leaderboard"){
            const tp=(gameData?.rounds||[]).reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q,r),0),0);
            let my=0;(gameData?.rounds||[]).forEach(r=>r.questions.forEach(q=>{my+=getEffectivePoints(q,playerId,answers[q.id],overrides,r)}));
            myScoreBlock=(
              <div style={{...cSty,marginTop:20,display:"inline-block",minWidth:200}}>
                <div style={{fontFamily:dFont,fontSize:36,color:T.gold}}>{my}<span style={{fontSize:18,color:T.mut}}>/{tp}</span></div>
                <div style={{fontSize:13,color:T.mut,marginTop:4}}>Your score so far</div>
              </div>
            );
          }
          // Allow players to pick an avatar before the game starts (lobby or cover slide).
          const preGame=!gameState||gameState.type==="cover";
          return (
            <div style={{textAlign:"center",width:"100%",maxWidth:420}}>
              <div style={{fontSize:48,marginBottom:16,animation:"pulse 2s infinite"}}>{avatar||icon}</div>
              <h3 style={{fontFamily:dFont,fontSize:24,margin:0}}><GT>{msg}</GT></h3>
              {sub&&<p style={{color:T.mut,fontSize:14,marginTop:8}}>{sub}</p>}
              {myScoreBlock}
              {preGame&&<AvatarPicker value={avatar} onChange={setAvatar}/>}
            </div>
          );
        })()}

        {phase==="question"&&currentQ&&(
          <div style={{width:"100%",maxWidth:500}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <span style={{fontSize:12,padding:"4px 12px",borderRadius:8,background:`${T.acc}22`,color:T.acc}}>{currentQ.roundEmoji} {currentQ.roundName}</span>
              <span style={{fontSize:12,padding:"4px 12px",borderRadius:8,background:`${T.pink}22`,color:T.pink,marginLeft:8}}>{maxPoints(currentQ,currentRound)} pt{maxPoints(currentQ,currentRound)===1?"":"s"}{currentQ.type==="music"?" (Artist + Song)":""}</span>
            </div>
            <div style={{...cSty,marginBottom:16}}>
              <p style={{fontSize:16,lineHeight:1.6,margin:0,color:T.txt}}>{currentQ.text}</p>
              {currentQ.image&&<div style={{display:"flex",justifyContent:"center",marginTop:12}}><img src={currentQ.image} alt="" style={{maxWidth:"100%",maxHeight:240,objectFit:"contain",borderRadius:10}}/></div>}
              {currentQ.hint&&<p style={{fontSize:13,color:T.pink,marginTop:8,marginBottom:0}}>💡 {currentQ.hint}</p>}
            </div>
            {already?(
              <div style={{textAlign:"center",padding:"20px 18px",borderRadius:14,background:`${T.acc}11`,border:`1px solid ${T.acc}33`}}>
                <div style={{fontFamily:dFont,fontSize:18,color:T.txt,letterSpacing:.5}}>Answer submitted</div>
                <div style={{fontSize:13,color:T.mut,marginTop:6}}>Waiting for the host to move on…</div>
                <div style={{fontSize:14,color:T.mut,marginTop:10,padding:"6px 12px",background:"#0d0d25",borderRadius:8,display:"inline-block",maxWidth:"100%",wordBreak:"break-word"}}>
                  {currentQ.type==="music"&&typeof already==="object"?`${already.artist||"—"} / ${already.songTitle||"—"}`:String(already)}
                </div>
                <div style={{marginTop:10}}>
                  <button onClick={()=>setAnswers(prev=>{const n={...prev};delete n[currentQ.id];return n})} style={{background:"none",border:"none",color:T.pink,cursor:"pointer",fontFamily:font,fontSize:12,textDecoration:"underline"}}>Change answer</button>
                </div>
              </div>
            ):(
              currentQ.type==="choice"&&currentQ.options?(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {currentQ.options.map((opt,i)=>(
                    <button key={i} onClick={()=>submitAnswer(currentQ.id,opt)} style={{...cSty,color:T.txt,fontFamily:font,cursor:"pointer",textAlign:"left",fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=T.cb}>
                      <span style={{width:32,height:32,borderRadius:8,background:T.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontFamily:dFont,color:"#fff",flexShrink:0}}>{String.fromCharCode(65+i)}</span>{opt}
                    </button>
                  ))}
                </div>
              ):currentQ.type==="music"?(
                <div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:T.pink,display:"block",marginBottom:4,fontWeight:600}}>Artist (1 pt)</label>
                    <Inp value={musicArtist} onChange={setMusicArtist} placeholder="Artist name..."/>
                  </div>
                  <div style={{marginBottom:10}}>
                    <label style={{fontSize:12,color:T.grn,display:"block",marginBottom:4,fontWeight:600}}>Song Title (1 pt)</label>
                    <Inp value={musicSong} onChange={setMusicSong} placeholder="Song title..."/>
                  </div>
                  <Btn onClick={()=>submitAnswer(currentQ.id,{artist:musicArtist,songTitle:musicSong})} variant="gold" style={{width:"100%",marginTop:6}} disabled={!musicArtist.trim()&&!musicSong.trim()}>Submit Answer</Btn>
                </div>
              ):(
                <div>
                  <Inp value={currentInput} onChange={setCurrentInput} placeholder={currentQ.type==="range"?"Enter a number...":"Type your answer..."}/>
                  <Btn onClick={()=>submitAnswer(currentQ.id,currentInput)} variant="gold" style={{width:"100%",marginTop:10}} disabled={!currentInput.trim()}>Submit Answer</Btn>
                </div>
              )
            )}
          </div>
        )}

        {phase==="answer"&&currentQ&&(
          <div style={{textAlign:"center",width:"100%",maxWidth:500}}>
            <p style={{fontSize:14,color:T.mut,marginBottom:16}}>{currentQ.text}</p>
            {gameState.answerRevealed!==true?(
              <div style={{padding:32,textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12,animation:"pulse 2s infinite"}}>🔒</div>
                <div style={{fontFamily:dFont,fontSize:18,color:T.mut}}>Waiting for host to reveal the answer...</div>
              </div>
            ):(
              <>
                {currentQ.answerImage&&<div style={{display:"flex",justifyContent:"center",marginBottom:14}}><img src={currentQ.answerImage} alt="" style={{maxWidth:"100%",maxHeight:240,objectFit:"contain",borderRadius:10}}/></div>}
                {currentQ.type==="music"?(
                  <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center",marginBottom:16}}>
                    <div style={{padding:"16px 28px",borderRadius:14,background:`${T.grn}15`,border:`2px solid ${T.grn}`,width:"100%"}}>
                      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2.5,color:T.grn,marginBottom:4,fontWeight:800}}>🎤 Artist</div>
                      <div style={{fontFamily:dFont,fontSize:22,color:T.grn}}>{currentQ.artist}</div>
                    </div>
                    <div style={{padding:"16px 28px",borderRadius:14,background:`${T.grn}15`,border:`2px solid ${T.grn}`,width:"100%"}}>
                      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2.5,color:T.grn,marginBottom:4,fontWeight:800}}>🎵 Song Title</div>
                      <div style={{fontFamily:dFont,fontSize:22,color:T.grn}}>{currentQ.songTitle}</div>
                    </div>
                  </div>
                ):(
                  <div style={{padding:"20px 32px",borderRadius:16,background:`${T.grn}15`,border:`2px solid ${T.grn}`,marginBottom:16}}>
                    <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:T.grn,marginBottom:6}}>Answer</div>
                    <div style={{fontFamily:dFont,fontSize:28,color:T.grn}}>{currentQ.display||currentQ.answer}</div>
                  </div>
                )}
                {answers[currentQ.id]&&(()=>{
                  const pts=getEffectivePoints(currentQ,playerId,answers[currentQ.id],overrides,currentRound);
                  const mp=maxPoints(currentQ,currentRound);
                  const isFull=pts>=mp&&mp>0;
                  const color=isFull?T.grn:pts>0?T.gold:T.pink;
                  return <div style={{padding:"12px 20px",borderRadius:12,fontSize:14,background:`${color}22`,border:`1px solid ${color}44`,color}}>
                    {isFull?`✓ Full marks! — ${pts}/${mp} pts`:pts>0?`½ Partial — ${pts}/${mp} pts`:`✗ No points — 0/${mp}`}{" "}
                    {currentQ.type==="music"&&typeof answers[currentQ.id]==="object"&&<span style={{opacity:.7}}>({answers[currentQ.id].artist||"—"} / {answers[currentQ.id].songTitle||"—"})</span>}
                  </div>;
                })()}
              </>
            )}
          </div>
        )}

        {phase==="results"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h3 style={{fontFamily:dFont,fontSize:28}}><GT>Game Over!</GT></h3>
            <p style={{color:T.mut,fontSize:14}}>Check the host screen for final scores</p>
            {(()=>{
              const tp=(gameData?.rounds||[]).reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q,r),0),0);
              let my=0;(gameData?.rounds||[]).forEach(r=>r.questions.forEach(q=>{my+=getEffectivePoints(q,playerId,answers[q.id],overrides,r)}));
              return <div style={{...cSty,marginTop:20}}><div style={{fontFamily:dFont,fontSize:36,color:T.gold}}>{my}<span style={{fontSize:18,color:T.mut}}>/{tp}</span></div><div style={{fontSize:13,color:T.mut,marginTop:4}}>Your Score</div></div>;
            })()}
          </div>
        )}
      </div>
      {showAlbie&&<AlbieActions gameCode={gameCode} playerName={playerName} avatar={avatar}/>}
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════
export default function TriviaApp(){
  const[screen,setScreen]=useState("home");
  const[cover,setCover]=useState(DEFAULT_COVER);
  const[rounds,setRounds]=useState(PRELOADED_ROUNDS);
  const[gameCode,setGameCode]=useState("");
  const[players,setPlayers]=useState([]);
  const[slideIndex,setSlideIndex]=useState(0);
  const[playerGameCode,setPlayerGameCode]=useState("");
  const[playerName,setPlayerName]=useState("");
  const[playerId,setPlayerId]=useState(()=>genId());
  const[playerGameData,setPlayerGameData]=useState(null);
  const[draftLoaded,setDraftLoaded]=useState(false);
  const[rejoinChecked,setRejoinChecked]=useState(false);
  const[joinPrefillCode,setJoinPrefillCode]=useState("");

  // Boot: load persisted draft (for the builder), then check the URL for a
  // game code and try to auto-rejoin as host or player.
  useEffect(()=>{(async()=>{
    // 1. Load builder draft
    const s=await storageGet("trivia:draft");
    if(s){
      if(Array.isArray(s)){
        if(s.length>0) setRounds(s);
      }else if(typeof s==="object"){
        if(Array.isArray(s.rounds)&&s.rounds.length>0) setRounds(s.rounds);
        if(s.cover&&typeof s.cover==="object") setCover({...DEFAULT_COVER,...s.cover});
      }
    }

    // 2. URL-based rejoin: if path is /CODE, look up local sessions and Firebase
    const pathCode=parsePathCode();
    if(pathCode){
      const gameData=await storageGet(`game:${pathCode}:host`,true);
      const hostSess=lsGet(SESSION_HOST_KEY(pathCode));
      const playerSess=lsGet(SESSION_PLAYER_KEY(pathCode));
      if(gameData && hostSess){
        // Resume as host. Use the absence of `game:CODE:state` to know whether
        // the host had reached the live game yet (game.start clicked) vs. was
        // still in the lobby waiting for players.
        if(gameData.cover) setCover({...DEFAULT_COVER,...gameData.cover});
        if(Array.isArray(gameData.rounds)) setRounds(gameData.rounds);
        setGameCode(pathCode);
        setSlideIndex(Number.isFinite(hostSess.slideIndex)?hostSess.slideIndex:0);
        const liveState=await storageGet(`game:${pathCode}:state`,true);
        setScreen(liveState?"host-game":"host-lobby");
      }else if(gameData && playerSess && playerSess.playerId && playerSess.name){
        // Resume as player with the same playerId so their answers persist
        setPlayerId(playerSess.playerId);
        setPlayerName(playerSess.name);
        setPlayerGameCode(pathCode);
        setPlayerGameData(gameData);
        setScreen("player-game");
      }else if(gameData){
        // Game exists but no local session — drop into Join with code prefilled
        setJoinPrefillCode(pathCode);
        setScreen("player-join");
      }else{
        // Code doesn't match any active game; reset URL
        pushUrl("/");
      }
    }

    setDraftLoaded(true);
    setRejoinChecked(true);
  })()},[]);

  useEffect(()=>{
    if(!draftLoaded) return;
    storageSet("trivia:draft",{cover,rounds});
  },[cover,rounds,draftLoaded]);

  // Persist host's slide position so they can refresh / rejoin mid-game
  useEffect(()=>{
    if(screen!=="host-game"||!gameCode)return;
    lsSet(SESSION_HOST_KEY(gameCode),{slideIndex});
  },[screen,gameCode,slideIndex]);

  // Browser back/forward: keep the URL in sync with the active screen.
  // While in a live game, swallow the navigation and re-pin the URL.
  useEffect(()=>{
    const handler=()=>{
      const pathCode=parsePathCode();
      if(screen==="host-game"&&gameCode){
        if(pathCode!==gameCode){try{window.history.replaceState({},"",`/${gameCode}`)}catch{}}
        return;
      }
      if(screen==="player-game"&&playerGameCode){
        if(pathCode!==playerGameCode){try{window.history.replaceState({},"",`/${playerGameCode}`)}catch{}}
        return;
      }
      if(!pathCode){setScreen("home")}
    };
    window.addEventListener("popstate",handler);
    return()=>window.removeEventListener("popstate",handler);
  },[screen,gameCode,playerGameCode]);

  function startHostLobby(){
    const c=genCode();
    setGameCode(c);setPlayers([]);setSlideIndex(0);
    storageSet(`game:${c}:host`,{cover,rounds},true);
    storageSet(`game:${c}:overrides`,{},true);
    lsSet(SESSION_HOST_KEY(c),{slideIndex:0});
    pushUrl(`/${c}`);
    setScreen("host-lobby");
  }

  useEffect(()=>{
    if(screen!=="host-lobby"&&screen!=="host-game")return;if(!gameCode)return;
    const poll=async()=>{
      const keys=await storageList(`game:${gameCode}:player:`,true);const pd=[];
      for(const k of keys){const d=await storageGet(k,true);if(d)pd.push(d)}
      setPlayers(pd);
    };
    poll();const iv=setInterval(poll,2000);return()=>clearInterval(iv);
  },[screen,gameCode]);

  function startGame(){setSlideIndex(0);setScreen("host-game")}
  function endGame(){
    storageSet(`game:${gameCode}:state`,{type:"results"},true);
    if(gameCode) lsDel(SESSION_HOST_KEY(gameCode));
    pushUrl("/");
    setScreen("home");
  }
  function backHomeFromLobby(){
    if(gameCode) lsDel(SESSION_HOST_KEY(gameCode));
    pushUrl("/");
    setScreen("home");
  }
  function handlePlayerJoin(c,n,d,existingId){
    // If the join lookup found a player slot with this name already in the
    // room, take over that id so the player resumes their prior progress.
    const id=existingId||playerId;
    if(existingId&&existingId!==playerId) setPlayerId(existingId);
    setPlayerGameCode(c);setPlayerName(n);setPlayerGameData(d);
    lsSet(SESSION_PLAYER_KEY(c),{playerId:id,name:n});
    pushUrl(`/${c}`);
    setScreen("player-game");
  }
  function handlePlayerLeave(){
    if(playerGameCode) lsDel(SESSION_PLAYER_KEY(playerGameCode));
    pushUrl("/");
    setScreen("home");
  }
  function backHomeFromJoin(){
    pushUrl("/");
    setJoinPrefillCode("");
    setScreen("home");
  }

  // Block initial render until rejoin check finishes — prevents a flash
  // of the home screen for users hitting a /CODE link directly.
  if(!rejoinChecked){
    return <div style={{minHeight:"100vh",background:T.bg}}/>;
  }

  if(screen==="home")return <HomeScreen onNavigate={t=>{if(t==="builder")setScreen("builder");else if(t==="host-lobby")startHostLobby();else if(t==="player-join"){pushUrl("/");setScreen("player-join")}}}/>;
  if(screen==="builder")return <Builder cover={cover} setCover={setCover} rounds={rounds} setRounds={setRounds} onBack={()=>setScreen("home")} onStartHost={startHostLobby}/>;
  if(screen==="host-lobby")return <HostLobby rounds={rounds} gameCode={gameCode} players={players} onStart={startGame} onBack={backHomeFromLobby}/>;
  if(screen==="host-game")return <HostPresentation cover={cover} rounds={rounds} gameCode={gameCode} players={players} slideIndex={slideIndex} setSlideIndex={setSlideIndex} onEnd={endGame}/>;
  if(screen==="player-join")return <PlayerJoin prefillCode={joinPrefillCode} onJoin={handlePlayerJoin} onBack={backHomeFromJoin}/>;
  if(screen==="player-game")return <PlayerGame gameCode={playerGameCode} playerName={playerName} playerId={playerId} initialGameData={playerGameData} onLeave={handlePlayerLeave}/>;
  return <HomeScreen onNavigate={()=>setScreen("home")}/>;
}
