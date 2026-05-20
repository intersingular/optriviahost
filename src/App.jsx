import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { ref, set, get } from "firebase/database";
import { db } from "./firebase";

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

function fuzzyMatch(guess, correct) {
  const g = normalize(guess), c = normalize(correct);
  if (!g || !c) return false;
  if (g === c) return true;
  if (c.includes(g) && g.length > 2) return true;
  if (g.includes(c) && c.length > 2) return true;
  const parts = correct.split(/\s*(?:and|&|,|-)\s*/i).map(normalize);
  if (parts.length > 1 && parts.every(p => g.includes(p))) return true;
  return false;
}

// Returns points for a question (1 for normal, up to 2 for music)
function scoreAnswer(question, playerAnswer) {
  if (!playerAnswer) return 0;
  if (question.type === "music") {
    const ans = typeof playerAnswer === "object" ? playerAnswer : {};
    let pts = 0;
    if (fuzzyMatch(ans.artist || "", question.artist || "")) pts++;
    if (fuzzyMatch(ans.songTitle || "", question.songTitle || "")) pts++;
    return pts;
  }
  if (question.type === "choice") return normalize(playerAnswer) === normalize(question.answer) ? 1 : 0;
  if (question.type === "range") {
    const num = parseFloat(String(playerAnswer).replace(/[^0-9.\-]/g,""));
    if (isNaN(num)) return 0;
    return num >= (question.min ?? -Infinity) && num <= (question.max ?? Infinity) ? 1 : 0;
  }
  return fuzzyMatch(playerAnswer, question.answer) ? 1 : 0;
}

// Max possible points for a question
function maxPoints(q) { return q.type === "music" ? 2 : 1; }

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
function buildSlides(rounds, includeObj=true) {
  const s=[], pairs=[];
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
// Production YouTube embed using IFrame Player API for clip start/end control.
// Requires hosting on a real domain (YouTube embeds are blocked in artifact sandbox).
function YTPlayer({videoId,start,end}){
  const[playing,setPlaying]=useState(false);
  const[showVideo,setShowVideo]=useState(false);
  const playerRef=useRef(null);
  const containerRef=useRef(null);
  const timerRef=useRef(null);
  const startSec=parseTime(start)||0;
  const endSec=parseTime(end);

  // Load YouTube IFrame API once
  useEffect(()=>{
    if(window.YT) return;
    const tag=document.createElement("script");
    tag.src="https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  },[]);

  // Create player when activated
  useEffect(()=>{
    if(!playing) return;
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
            // Loop: when video ends or reaches end time, restart clip
            if(e.data===window.YT.PlayerState.ENDED){
              e.target.seekTo(startSec);
              e.target.playVideo();
            }
          },
        },
      });
      // Backup timer to enforce end time (YT end param isn't always reliable for looping)
      if(endSec&&endSec>startSec){
        timerRef.current=setInterval(()=>{
          if(playerRef.current?.getCurrentTime&&playerRef.current.getCurrentTime()>=endSec){
            playerRef.current.seekTo(startSec);
            playerRef.current.playVideo();
          }
        },500);
      }
    };
    if(window.YT&&window.YT.Player) initPlayer();
    else window.onYouTubeIframeAPIReady=initPlayer;

    return()=>{
      if(timerRef.current) clearInterval(timerRef.current);
      if(playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current=null;
    };
  },[playing,videoId,startSec,endSec]);

  function stop(){
    if(timerRef.current) clearInterval(timerRef.current);
    if(playerRef.current?.destroy) playerRef.current.destroy();
    playerRef.current=null;
    setPlaying(false);
  }

  if(!playing) return (
    <button onClick={()=>setPlaying(true)} style={{background:"linear-gradient(135deg,#FF6B9D,#C850C0)",border:"none",borderRadius:20,padding:"16px 36px",color:"#fff",fontFamily:"'Righteous',cursive",fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"all .2s",boxShadow:"0 4px 24px #C850C044"}}
    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
      <span style={{fontSize:28}}>▶</span> Play Clip
    </button>
  );

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
      {/* YouTube player container */}
      <div style={{
        borderRadius:14,overflow:"hidden",border:"2px solid #C850C044",boxShadow:"0 4px 30px #C850C033",
        width:showVideo?480:320, height:showVideo?270:0,
        transition:"all .3s ease", background:"#000",
      }}>
        <div ref={containerRef} />
      </div>

      {/* Controls */}
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",justifyContent:"center"}}>
        <style>{`@keyframes eqB{0%,100%{height:6px}50%{height:20px}}`}</style>
        <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 18px",borderRadius:12,background:"#C850C022",border:"1px solid #C850C044"}}>
          <div style={{display:"flex",alignItems:"end",gap:2,height:20}}>
            {[0,.12,.24,.08,.2].map((d,i)=><div key={i} style={{width:3,borderRadius:2,background:"linear-gradient(180deg,#FF6B9D,#C850C0)",animation:`eqB ${.4+Math.random()*.4}s ease-in-out ${d}s infinite`}}/>)}
          </div>
          <span style={{fontFamily:"'Righteous',cursive",fontSize:13,color:"#FF6B9D"}}>
            {start||"0:00"}{end?" → "+end:""} Playing
          </span>
        </div>

        <label onClick={()=>setShowVideo(v=>!v)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",fontSize:12,color:"#8888AA",userSelect:"none"}}>
          <span style={{
            width:18,height:18,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center",
            background:showVideo?"#C850C0":"transparent",border:`2px solid ${showVideo?"#C850C0":"#555"}`,
            fontSize:11,color:"#fff",transition:"all .15s",
          }}>{showVideo?"✓":""}</span>
          Show video
        </label>

        <button onClick={stop} style={{background:"#FF6B9D22",border:"1px solid #FF6B9D44",borderRadius:8,padding:"5px 12px",color:"#FF6B9D",cursor:"pointer",fontFamily:"'Quicksand',sans-serif",fontSize:12,fontWeight:600}}>Stop</button>
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

function Inp({value,onChange,placeholder,style,type="text",multiline}){
  const sh={fontFamily:font,fontSize:15,color:T.txt,background:"#0d0d25",border:`1px solid ${T.cb}`,borderRadius:12,padding:"12px 16px",width:"100%",outline:"none",boxSizing:"border-box",transition:"border-color .2s"};
  if(multiline)return <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3} style={{...sh,resize:"vertical",...style}}/>;
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={{...sh,...style}}/>;
}

const globalCSS=`@import url('https://fonts.googleapis.com/css2?family=Righteous&family=Quicksand:wght@400;600;700&display=swap');*{box-sizing:border-box}`;

// ═══════════════════════════════════════════
//  HOME
// ═══════════════════════════════════════════
function HomeScreen({onNavigate}){
  return(
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24,fontFamily:font}}>
      <style>{globalCSS}{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}@keyframes slideUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{animation:"float 3s ease-in-out infinite",marginBottom:12,fontSize:64}}>🎉</div>
      <h1 style={{fontFamily:dFont,fontSize:48,margin:0,textAlign:"center"}}><GT>Trivia Night</GT></h1>
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
function Builder({rounds,setRounds,onBack,onStartHost}){
  const[activeRound,setActiveRound]=useState(0);
  const[editingQ,setEditingQ]=useState(null);
  const[showAddRound,setShowAddRound]=useState(false);
  const[newRoundName,setNewRoundName]=useState("");
  const round=rounds[activeRound];

  function addRound(){if(!newRoundName.trim())return;setRounds(p=>[...p,{id:genId(),name:newRoundName.trim(),emoji:"❓",questions:[]}]);setNewRoundName("");setShowAddRound(false);setActiveRound(rounds.length)}
  function deleteRound(idx){setRounds(p=>p.filter((_,i)=>i!==idx));setActiveRound(Math.max(0,activeRound-1))}
  function addQuestion(){const nq={id:genId(),type:"text",text:"",answer:"",hint:""};setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:[...r.questions,nq]}:r));setEditingQ(round.questions.length)}
  function updateQ(qi,u){setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:r.questions.map((q,j)=>j===qi?{...q,...u}:q)}:r))}
  function deleteQ(qi){setRounds(p=>p.map((r,i)=>i===activeRound?{...r,questions:r.questions.filter((_,j)=>j!==qi)}:r));setEditingQ(null)}

  const typeLabel=t=>t==="choice"?"Multiple Choice":t==="range"?"Number Range":t==="music"?"🎵 Music":"Text";
  const typeColor=t=>t==="choice"?"#7B93FF":t==="range"?T.grn:t==="music"?T.pink:T.acc;
  const typeBg=t=>t==="choice"?"#4158D044":t==="range"?"#43E97B33":t==="music"?"#FF6B9D33":"#C850C044";

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt}}>
      <style>{globalCSS}</style>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 24px",borderBottom:`1px solid ${T.cb}`}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontFamily:font,fontSize:14}}>← Back</button>
        <h2 style={{fontFamily:dFont,fontSize:22,margin:0}}><GT>Trivia Builder</GT></h2>
        <Btn onClick={onStartHost} variant="gold" style={{fontSize:13,padding:"10px 20px"}}>▶ Host This</Btn>
      </div>
      <div style={{display:"flex",minHeight:"calc(100vh - 65px)"}}>
        {/* Sidebar */}
        <div style={{width:220,borderRight:`1px solid ${T.cb}`,padding:16,flexShrink:0,overflowY:"auto"}}>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1,color:T.mut,marginBottom:12}}>Rounds</div>
          {rounds.map((r,i)=>(
            <div key={r.id} onClick={()=>setActiveRound(i)} style={{padding:"10px 14px",borderRadius:12,marginBottom:6,cursor:"pointer",background:i===activeRound?"#1e1e45":"transparent",border:i===activeRound?`1px solid ${T.acc}44`:"1px solid transparent"}}>
              <div style={{fontSize:14,fontWeight:600,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{r.emoji} {r.name}</span>
                {rounds.length>1&&<span onClick={e=>{e.stopPropagation();deleteRound(i)}} style={{fontSize:11,color:T.mut,cursor:"pointer"}}>✕</span>}
              </div>
              <div style={{fontSize:11,color:T.mut,marginTop:2}}>{r.questions.length} questions · {r.questions.reduce((s,q)=>s+maxPoints(q),0)} pts</div>
            </div>
          ))}
          {showAddRound?(<div style={{marginTop:8}}><Inp value={newRoundName} onChange={setNewRoundName} placeholder="Round name..."/><div style={{display:"flex",gap:6,marginTop:6}}><Btn onClick={addRound} style={{fontSize:12,padding:"6px 14px",flex:1}}>Add</Btn><Btn onClick={()=>setShowAddRound(false)} variant="ghost" style={{fontSize:12,padding:"6px 14px"}}>✕</Btn></div></div>):
          (<button onClick={()=>setShowAddRound(true)} style={{width:"100%",padding:10,background:"none",border:`1px dashed ${T.cb}`,borderRadius:12,color:T.mut,cursor:"pointer",fontFamily:font,fontSize:13,marginTop:4}}>+ Add Round</button>)}
        </div>

        {/* Questions */}
        <div style={{flex:1,padding:24,overflowY:"auto",maxHeight:"calc(100vh - 65px)"}}>
          {round&&(<>
            <h3 style={{fontFamily:dFont,fontSize:26,margin:"0 0 20px"}}>{round.emoji} {round.name}</h3>
            {round.questions.map((q,qi)=>(
              <div key={q.id} style={{...cSty,marginBottom:12,cursor:"pointer"}} onClick={()=>setEditingQ(editingQ===qi?null:qi)}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <span style={{fontSize:11,color:T.acc,fontWeight:700,marginRight:8}}>Q{qi+1}</span>
                    <span style={{fontSize:10,padding:"2px 8px",borderRadius:6,marginRight:8,background:typeBg(q.type),color:typeColor(q.type)}}>{typeLabel(q.type)}</span>
                    {q.type==="music"&&<span style={{fontSize:10,color:T.gold}}>({maxPoints(q)} pts)</span>}
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
  const totalPts=rounds.reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q),0),0);
  const totalQ=rounds.reduce((s,r)=>s+r.questions.length,0);
  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <style>{globalCSS}{`@keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}`}</style>
      <button onClick={onBack} style={{position:"absolute",top:20,left:20,background:"none",border:"none",color:T.mut,cursor:"pointer",fontFamily:font}}>← Back</button>
      <div style={{fontSize:48,marginBottom:8}}>🎮</div>
      <h2 style={{fontFamily:dFont,fontSize:32,margin:"0 0 8px"}}><GT>Game Lobby</GT></h2>
      <p style={{color:T.mut,fontSize:14,marginBottom:32}}>{rounds.length} rounds · {totalQ} questions · {totalPts} total pts</p>
      <div style={{...cSty,textAlign:"center",marginBottom:24,minWidth:320}}>
        <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:T.mut,marginBottom:8}}>Join Code</div>
        <div style={{fontFamily:dFont,fontSize:56,letterSpacing:8,background:T.grad,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{gameCode}</div>
        <div style={{fontSize:12,color:T.mut,marginTop:8}}>Players enter this code to join</div>
      </div>
      <div style={{...cSty,marginBottom:24,minWidth:320}}>
        <div style={{fontSize:12,color:T.mut,marginBottom:12,display:"flex",alignItems:"center",gap:8}}>
          <span style={{display:"inline-block",width:8,height:8,borderRadius:"50%",background:T.grn,animation:"pulse 2s infinite"}}/>{players.length} player{players.length!==1?"s":""} connected
        </div>
        {players.length===0?<div style={{fontSize:14,color:T.mut,fontStyle:"italic"}}>Waiting for players... or start solo!</div>:
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{players.map(p=><span key={p.id} style={{padding:"6px 14px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,fontSize:13,fontWeight:600}}>{p.name}</span>)}</div>}
      </div>
      <Btn onClick={onStart} variant="gold" style={{fontSize:18,padding:"16px 48px"}}>🚀 Start Game</Btn>
    </div>
  );
}

// ═══════════════════════════════════════════
//  HOST PRESENTATION — two-click answer reveal
// ═══════════════════════════════════════════
function HostPresentation({rounds,gameCode,players,slideIndex,setSlideIndex,onEnd}){
  const[showConfetti,setShowConfetti]=useState(false);
  const[answerRevealed,setAnswerRevealed]=useState(false);
  const[overrides,setOverrides]=useState({}); // { "qId:pId": pointsAwarded }
  const[confirmEnd,setConfirmEnd]=useState(false);
  const[showNav,setShowNav]=useState(false);
  const slides=useMemo(()=>buildSlides(rounds,true),[rounds]);
  const slide=slides[slideIndex]||slides[0];
  const progress=((slideIndex+1)/slides.length)*100;
  const isAnswer=slide.type==="answer";

  // Reset reveal state when slide changes
  useEffect(()=>{setAnswerRevealed(false)},[slideIndex]);

  // Get effective points for a player on a question (override or auto-score)
  function getPoints(q, playerId, playerAnswer) {
    const key = `${q.id}:${playerId}`;
    if (key in overrides) return overrides[key];
    return scoreAnswer(q, playerAnswer);
  }

  // Toggle override: cycle through possible point values
  function toggleOverride(q, playerId, playerAnswer) {
    const key = `${q.id}:${playerId}`;
    const current = key in overrides ? overrides[key] : scoreAnswer(q, playerAnswer);
    const mp = maxPoints(q);
    const next = (current + 1) % (mp + 1); // 0 → 1 → (2 for music) → 0
    setOverrides(prev => ({ ...prev, [key]: next }));
  }

  const totalPts=rounds.reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q),0),0);
  const scores=useMemo(()=>{
    return players.map(p=>{
      let score=0;
      rounds.forEach(r=>r.questions.forEach(q=>{score+=getPoints(q,p.id,p.answers?.[q.id])}));
      return{...p,score};
    }).sort((a,b)=>b.score-a.score);
  },[players,rounds,overrides]);

  useEffect(()=>{if(slide.type==="results"){setShowConfetti(true);const t=setTimeout(()=>setShowConfetti(false),4000);return()=>clearTimeout(t)}},[slide.type]);

  // Keyboard/click nav with answer reveal logic
  const handleAdvance=useCallback(()=>{
    if(isAnswer&&!answerRevealed){setAnswerRevealed(true);return;}
    setSlideIndex(i=>Math.min(i+1,slides.length-1));
  },[isAnswer,answerRevealed,slides.length]);

  const handleBack=useCallback(()=>{
    if(isAnswer&&answerRevealed){setAnswerRevealed(false);return;}
    setSlideIndex(i=>Math.max(i-1,0));
  },[isAnswer,answerRevealed]);

  useEffect(()=>{
    const handler=(e)=>{
      if(e.key==="ArrowRight"||e.key===" "){e.preventDefault();handleAdvance();}
      if(e.key==="ArrowLeft"){e.preventDefault();handleBack();}
    };
    window.addEventListener("keydown",handler);
    return()=>window.removeEventListener("keydown",handler);
  },[handleAdvance,handleBack]);

  const bgs=["radial-gradient(ellipse at 20% 50%,#4158D033 0%,transparent 60%)","radial-gradient(ellipse at 80% 30%,#C850C033 0%,transparent 60%)","radial-gradient(ellipse at 50% 80%,#43E97B22 0%,transparent 60%)"];
  const hasYT=slide.type==="question"&&slide.question?.type==="music"&&slide.question?.ytUrl&&extractYTId(slide.question.ytUrl);

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,position:"relative",overflow:"hidden"}}>
      <style>{globalCSS}{`
        @keyframes slideIn{from{opacity:0;transform:translateY(40px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes glow{0%,100%{text-shadow:0 0 30px #C850C066}50%{text-shadow:0 0 60px #C850C0aa}}
        @keyframes revealPop{from{opacity:0;transform:scale(.7) rotate(-3deg)}to{opacity:1;transform:scale(1) rotate(0)}}
      `}</style>
      <Confetti active={showConfetti}/>
      <div style={{position:"absolute",inset:0,background:bgs[slideIndex%3],transition:"background 1s"}}/>

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
        {slideIndex>=slides.length-1&&!isAnswer?(
          <Btn onClick={onEnd} variant="gold" style={{padding:"10px 20px",fontSize:14}}>End Game 🏁</Btn>
        ):isAnswer&&!answerRevealed?(
          <Btn onClick={handleAdvance} variant="reveal" style={{padding:"10px 24px",fontSize:14}}>✨ Reveal Answer</Btn>
        ):(
          <Btn onClick={handleAdvance} style={{padding:"10px 20px",fontSize:14}} disabled={slideIndex>=slides.length-1}>Next →</Btn>
        )}
      </div>

      {/* Slide Navigator Modal */}
      {showNav&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:24,backdropFilter:"blur(4px)"}} onClick={()=>setShowNav(false)}>
          <div style={{...cSty,maxWidth:520,width:"100%",maxHeight:"80vh",overflowY:"auto",border:`1px solid ${T.acc}44`}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <h3 style={{fontFamily:dFont,fontSize:20,margin:0}}><GT>Jump to Slide</GT></h3>
              <button onClick={()=>setShowNav(false)} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:4}}>
              {slides.map((s,i)=>{
                const isCurrent=i===slideIndex;
                let label="",icon="",section="";
                if(s.type==="round-title"){
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
                }else if(s.type==="results"){
                  icon="🏆"; label="Final Scores"; section="results";
                }
                const isHeader=s.type==="round-title"||s.type==="divider"||s.type==="results";
                const sColor=section==="answer"?T.grn:section==="divider"?T.gold:section==="results"?T.gold:T.txt;
                return (
                  <button key={i} onClick={()=>{setSlideIndex(i);setShowNav(false)}} style={{
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
      )}

      {/* Slide */}
      <div key={`${slideIndex}-${answerRevealed}`} style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 40px 100px",position:"relative",zIndex:10,animation:"slideIn .5s ease"}}>

        {slide.type==="round-title"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:80,marginBottom:16}}>{slide.round.emoji}</div>
            <div style={{fontSize:14,textTransform:"uppercase",letterSpacing:3,color:T.mut,marginBottom:12}}>
              {slide.phase==="questions"?`Round ${slide.roundIdx+1}`:`Round ${slide.roundIdx+1} — Answers`}
            </div>
            <h1 style={{fontFamily:dFont,fontSize:56,margin:0,animation:"glow 3s infinite"}}><GT>{slide.round.name}</GT></h1>
            <p style={{color:T.mut,marginTop:16,fontSize:18}}>{slide.round.questions.length} question{slide.round.questions.length!==1?"s":""} · {slide.round.questions.reduce((s,q)=>s+maxPoints(q),0)} pts</p>
          </div>
        )}

        {slide.type==="question"&&(
          <div style={{textAlign:"center",maxWidth:900}}>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:24}}>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,color:T.acc}}>{slide.round.emoji} {slide.round.name}</span>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.gold}22`,border:`1px solid ${T.gold}44`,color:T.gold}}>Q{slide.questionIdx+1} of {slide.round.questions.length}</span>
              {slide.question.type==="music"&&<span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.pink}22`,border:`1px solid ${T.pink}44`,color:T.pink}}>2 pts (Artist + Song)</span>}
            </div>
            <h2 style={{fontFamily:dFont,fontSize:38,lineHeight:1.3,margin:"0 0 24px",fontWeight:400}}>{slide.question.text}</h2>
            {slide.question.hint&&!hasYT&&<p style={{color:T.pink,fontSize:16,fontStyle:"italic"}}>💡 {slide.question.hint}</p>}
            {hasYT&&<div style={{marginTop:8,marginBottom:16,display:"flex",justifyContent:"center"}}><YTPlayer key={slide.question.id} videoId={extractYTId(slide.question.ytUrl)} start={slide.question.ytStart} end={slide.question.ytEnd}/></div>}
            {slide.question.type==="choice"&&slide.question.options&&(
              <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginTop:24}}>
                {slide.question.options.map((opt,i)=><div key={i} style={{padding:"14px 28px",borderRadius:14,background:T.card,border:`2px solid ${T.cb}`,fontSize:20,fontWeight:600,fontFamily:dFont}}>{String.fromCharCode(65+i)}. {opt}</div>)}
              </div>
            )}
            {players.length>0&&<div style={{marginTop:32,fontSize:14,color:T.mut}}>{players.filter(p=>p.answers?.[slide.question.id]).length}/{players.length} answered</div>}
          </div>
        )}

        {slide.type==="answer"&&(
          <div style={{textAlign:"center",maxWidth:900}}>
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.acc}22`,border:`1px solid ${T.acc}44`,color:T.acc}}>{slide.round.emoji} {slide.round.name}</span>
              <span style={{fontSize:13,padding:"6px 16px",borderRadius:10,background:`${T.grn}22`,border:`1px solid ${T.grn}44`,color:T.grn}}>Answer {slide.questionIdx+1}</span>
            </div>
            {/* Always show the question */}
            <h2 style={{fontFamily:dFont,fontSize:32,lineHeight:1.4,margin:"0 0 28px",fontWeight:400,color:T.txt,maxWidth:750,marginLeft:"auto",marginRight:"auto"}}>
              {slide.question.text}
            </h2>

            {/* Answer — only shown after reveal click */}
            {answerRevealed&&(
              <div style={{animation:"revealPop .6s cubic-bezier(.17,.67,.35,1.3)"}}>
                {slide.question.type==="music"?(
                  <div style={{display:"inline-flex",flexDirection:"column",gap:12}}>
                    <div style={{padding:"20px 40px",borderRadius:16,background:"linear-gradient(135deg,#FF6B9D22,#C850C022)",border:`2px solid ${T.pink}`}}>
                      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:T.pink,marginBottom:6}}>Artist (1 pt)</div>
                      <div style={{fontFamily:dFont,fontSize:36,color:T.pink}}>{slide.question.artist}</div>
                    </div>
                    <div style={{padding:"20px 40px",borderRadius:16,background:"linear-gradient(135deg,#43E97B22,#38F9D722)",border:`2px solid ${T.grn}`}}>
                      <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:2,color:T.grn,marginBottom:6}}>Song Title (1 pt)</div>
                      <div style={{fontFamily:dFont,fontSize:36,color:T.grn}}>{slide.question.songTitle}</div>
                    </div>
                  </div>
                ):(
                  <div style={{display:"inline-block",padding:"24px 48px",borderRadius:20,background:"linear-gradient(135deg,#43E97B22,#38F9D722)",border:`2px solid ${T.grn}`}}>
                    <div style={{fontSize:12,textTransform:"uppercase",letterSpacing:2,color:T.grn,marginBottom:8}}>Answer</div>
                    <div style={{fontFamily:dFont,fontSize:42,color:T.grn}}>{slide.question.display||slide.question.answer}</div>
                  </div>
                )}

                {/* Player results with override */}
                {players.length>0&&(
                  <div style={{marginTop:32,width:"100%",maxWidth:700,marginLeft:"auto",marginRight:"auto"}}>
                    <div style={{fontSize:13,color:T.mut,marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
                      Player Answers <span style={{fontSize:11,opacity:.6}}>(click to override)</span>
                    </div>
                    <div style={{display:"flex",flexDirection:"column",gap:6}}>
                      {players.map(p=>{
                        const ans=p.answers?.[slide.question.id];
                        const pts=getPoints(slide.question,p.id,ans);
                        const autopts=scoreAnswer(slide.question,ans);
                        const mp=maxPoints(slide.question);
                        const isOverridden=(`${slide.question.id}:${p.id}` in overrides);
                        const color=pts===mp?T.grn:pts>0?T.gold:T.pink;
                        const icon=pts===mp?"✓":pts>0?"½":"✗";
                        let display="";
                        if(slide.question.type==="music"&&ans&&typeof ans==="object") display=`${ans.artist||"—"} / ${ans.songTitle||"—"}`;
                        else if(ans) display=String(ans);
                        else display="No answer";
                        return <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:12,background:`${color}11`,border:`1px solid ${color}33`,transition:"all .2s"}}>
                          {/* Override toggle button */}
                          <button onClick={()=>toggleOverride(slide.question,p.id,ans)} title="Click to change ruling" style={{
                            width:36,height:36,borderRadius:10,border:`2px solid ${color}`,background:`${color}22`,
                            color,fontSize:16,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",
                            fontFamily:dFont,transition:"all .15s",flexShrink:0,position:"relative",
                          }}
                          onMouseEnter={e=>{e.currentTarget.style.background=`${color}44`;e.currentTarget.style.transform="scale(1.1)"}}
                          onMouseLeave={e=>{e.currentTarget.style.background=`${color}22`;e.currentTarget.style.transform="scale(1)"}}>
                            {pts}/{mp}
                          </button>
                          {/* Player name */}
                          <div style={{flex:1,textAlign:"left"}}>
                            <div style={{fontSize:14,fontWeight:600,color:T.txt,display:"flex",alignItems:"center",gap:6}}>
                              {icon} {p.name}
                              {isOverridden&&<span style={{fontSize:9,padding:"2px 6px",borderRadius:4,background:`${T.gold}33`,color:T.gold,fontWeight:700}}>OVERRIDE</span>}
                            </div>
                            <div style={{fontSize:12,color:T.mut,marginTop:2}}>{display}</div>
                          </div>
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
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:80,marginBottom:16}}>📝</div>
            <h1 style={{fontFamily:dFont,fontSize:48,margin:0}}><GT>Answer Time!</GT></h1>
            <p style={{color:T.mut,fontSize:18,marginTop:16}}>Let's see how everyone did...</p>
          </div>
        )}

        {slide.type==="results"&&(
          <div style={{textAlign:"center",maxWidth:600,width:"100%"}}>
            <div style={{fontSize:64,marginBottom:8}}>🏆</div>
            <h1 style={{fontFamily:dFont,fontSize:44,margin:"0 0 32px"}}><GT>Final Scores</GT></h1>
            {scores.length===0?<p style={{color:T.mut}}>No players — host-only mode</p>:(
              <div style={{display:"flex",flexDirection:"column",gap:10}}>
                {scores.map((p,i)=>{
                  const pct=totalPts>0?(p.score/totalPts)*100:0;
                  const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`;
                  return <div key={p.id} style={{...cSty,display:"flex",alignItems:"center",gap:16,border:i===0?`2px solid ${T.gold}`:`1px solid ${T.cb}`,animation:`slideIn .5s ease ${i*.1}s both`}}>
                    <span style={{fontSize:i<3?32:18,minWidth:40,textAlign:"center",fontFamily:dFont}}>{medal}</span>
                    <div style={{flex:1,textAlign:"left"}}>
                      <div style={{fontWeight:700,fontSize:18}}>{p.name}</div>
                      <div style={{height:6,borderRadius:3,background:"#1a1a3e",marginTop:6,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:i===0?`linear-gradient(90deg,${T.gold},#FF9A44)`:T.grad,borderRadius:3,transition:"width 1s"}}/>
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
//  PLAYER JOIN
// ═══════════════════════════════════════════
function PlayerJoin({onJoin,onBack}){
  const[code,setCode]=useState("");const[name,setName]=useState("");const[error,setError]=useState("");const[loading,setLoading]=useState(false);
  async function handleJoin(){
    if(!code.trim()||!name.trim()){setError("Enter both a code and your name");return;}
    setLoading(true);setError("");
    const gd=await storageGet(`game:${code.toUpperCase()}:host`,true);
    if(!gd){setError("Game not found — check the code!");setLoading(false);return;}
    onJoin(code.toUpperCase(),name.trim(),gd);
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
  const[answers,setAnswers]=useState({});
  const[currentInput,setCurrentInput]=useState("");
  const[musicArtist,setMusicArtist]=useState("");
  const[musicSong,setMusicSong]=useState("");

  useEffect(()=>{storageSet(`game:${gameCode}:player:${playerId}`,{id:playerId,name:playerName,answers:{}},true)},[]);
  useEffect(()=>{
    const poll=async()=>{
      const st=await storageGet(`game:${gameCode}:state`,true);if(st)setGameState(st);
      const d=await storageGet(`game:${gameCode}:host`,true);if(d)setGameData(d);
    };
    poll();const iv=setInterval(poll,1500);return()=>clearInterval(iv);
  },[gameCode]);
  useEffect(()=>{storageSet(`game:${gameCode}:player:${playerId}`,{id:playerId,name:playerName,answers},true)},[answers]);

  const allQ=(gameData?.rounds||[]).flatMap(r=>r.questions.map(q=>({...q,roundName:r.name,roundEmoji:r.emoji})));
  let currentQ=null,phase="waiting";
  if(gameState){
    if(gameState.type==="question"){currentQ=allQ.find(q=>q.id===gameState.questionId);phase="question"}
    else if(gameState.type==="answer"){currentQ=allQ.find(q=>q.id===gameState.questionId);phase="answer"}
    else if(gameState.type==="results"){phase="results"}
  }

  // Reset inputs when question changes
  const prevQRef=useRef(null);
  useEffect(()=>{
    if(currentQ&&currentQ.id!==prevQRef.current){setCurrentInput("");setMusicArtist("");setMusicSong("");prevQRef.current=currentQ.id}
  },[currentQ]);

  function submitAnswer(qId,answer){setAnswers(prev=>({...prev,[qId]:answer}));setCurrentInput("");setMusicArtist("");setMusicSong("");}
  const already=currentQ&&answers[currentQ.id];

  return(
    <div style={{minHeight:"100vh",background:T.bg,fontFamily:font,color:T.txt,display:"flex",flexDirection:"column"}}>
      <style>{globalCSS}{`@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}`}</style>
      <div style={{padding:"12px 20px",borderBottom:`1px solid ${T.cb}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{fontSize:13,color:T.mut}}>{playerName}</div>
        <div style={{fontFamily:dFont,fontSize:14}}><GT>GAME {gameCode}</GT></div>
        <button onClick={onLeave} style={{background:"none",border:"none",color:T.mut,cursor:"pointer",fontSize:12,fontFamily:font}}>Leave</button>
      </div>
      <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>

        {phase==="waiting"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:16,animation:"pulse 2s infinite"}}>⏳</div>
            <h3 style={{fontFamily:dFont,fontSize:24}}><GT>{gameState?"Next question coming...":"Waiting for host..."}</GT></h3>
          </div>
        )}

        {phase==="question"&&currentQ&&(
          <div style={{width:"100%",maxWidth:500}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <span style={{fontSize:12,padding:"4px 12px",borderRadius:8,background:`${T.acc}22`,color:T.acc}}>{currentQ.roundEmoji} {currentQ.roundName}</span>
              {currentQ.type==="music"&&<span style={{fontSize:12,padding:"4px 12px",borderRadius:8,background:`${T.pink}22`,color:T.pink,marginLeft:8}}>2 pts</span>}
            </div>
            <div style={{...cSty,marginBottom:16}}>
              <p style={{fontSize:16,lineHeight:1.6,margin:0}}>{currentQ.text}</p>
              {currentQ.hint&&<p style={{fontSize:13,color:T.pink,marginTop:8,marginBottom:0}}>💡 {currentQ.hint}</p>}
            </div>
            {already?(
              <div style={{textAlign:"center",padding:24}}>
                <div style={{fontSize:32,marginBottom:8}}>✅</div>
                <div style={{fontFamily:dFont,fontSize:18,color:T.grn}}>Answer Submitted!</div>
                <div style={{fontSize:14,color:T.mut,marginTop:4}}>
                  {currentQ.type==="music"&&typeof already==="object"?`${already.artist||"—"} / ${already.songTitle||"—"}`:String(already)}
                </div>
                <button onClick={()=>setAnswers(prev=>{const n={...prev};delete n[currentQ.id];return n})} style={{background:"none",border:"none",color:T.pink,cursor:"pointer",fontFamily:font,fontSize:12,marginTop:8}}>Change answer</button>
              </div>
            ):(
              currentQ.type==="choice"&&currentQ.options?(
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {currentQ.options.map((opt,i)=>(
                    <button key={i} onClick={()=>submitAnswer(currentQ.id,opt)} style={{...cSty,cursor:"pointer",textAlign:"left",fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:12,transition:"all .2s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=T.acc} onMouseLeave={e=>e.currentTarget.style.borderColor=T.cb}>
                      <span style={{width:32,height:32,borderRadius:8,background:T.grad,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontFamily:dFont,flexShrink:0}}>{String.fromCharCode(65+i)}</span>{opt}
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
            {currentQ.type==="music"?(
              <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"center",marginBottom:16}}>
                <div style={{padding:"16px 28px",borderRadius:14,background:`${T.pink}15`,border:`2px solid ${T.pink}`,width:"100%"}}>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:2,color:T.pink,marginBottom:4}}>Artist</div>
                  <div style={{fontFamily:dFont,fontSize:22,color:T.pink}}>{currentQ.artist}</div>
                </div>
                <div style={{padding:"16px 28px",borderRadius:14,background:`${T.grn}15`,border:`2px solid ${T.grn}`,width:"100%"}}>
                  <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:2,color:T.grn,marginBottom:4}}>Song</div>
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
              const pts=scoreAnswer(currentQ,answers[currentQ.id]);const mp=maxPoints(currentQ);
              const color=pts===mp?T.grn:pts>0?T.gold:T.pink;
              return <div style={{padding:"12px 20px",borderRadius:12,fontSize:14,background:`${color}22`,border:`1px solid ${color}44`,color}}>
                {pts===mp?"✓ Full marks!":pts>0?`½ Partial — ${pts}/${mp} pts`:"✗ No points"}{" "}
                {currentQ.type==="music"&&typeof answers[currentQ.id]==="object"&&<span style={{opacity:.7}}>({answers[currentQ.id].artist||"—"} / {answers[currentQ.id].songTitle||"—"})</span>}
              </div>;
            })()}
          </div>
        )}

        {phase==="results"&&(
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:48,marginBottom:8}}>🏆</div>
            <h3 style={{fontFamily:dFont,fontSize:28}}><GT>Game Over!</GT></h3>
            <p style={{color:T.mut,fontSize:14}}>Check the host screen for final scores</p>
            {(()=>{
              const tp=(gameData?.rounds||[]).reduce((s,r)=>s+r.questions.reduce((ss,q)=>ss+maxPoints(q),0),0);
              let my=0;(gameData?.rounds||[]).forEach(r=>r.questions.forEach(q=>{my+=scoreAnswer(q,answers[q.id])}));
              return <div style={{...cSty,marginTop:20}}><div style={{fontFamily:dFont,fontSize:36,color:T.gold}}>{my}<span style={{fontSize:18,color:T.mut}}>/{tp}</span></div><div style={{fontSize:13,color:T.mut,marginTop:4}}>Your Score</div></div>;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════
export default function TriviaApp(){
  const[screen,setScreen]=useState("home");
  const[rounds,setRounds]=useState(PRELOADED_ROUNDS);
  const[gameCode,setGameCode]=useState("");
  const[players,setPlayers]=useState([]);
  const[slideIndex,setSlideIndex]=useState(0);
  const[playerGameCode,setPlayerGameCode]=useState("");
  const[playerName,setPlayerName]=useState("");
  const[playerId]=useState(()=>genId());
  const[playerGameData,setPlayerGameData]=useState(null);

  useEffect(()=>{storageSet("trivia:draft",rounds)},[rounds]);
  useEffect(()=>{(async()=>{const s=await storageGet("trivia:draft");if(s&&s.length>0)setRounds(s)})()},[]);

  function startHostLobby(){const c=genCode();setGameCode(c);setPlayers([]);setSlideIndex(0);storageSet(`game:${c}:host`,{rounds},true);setScreen("host-lobby")}

  useEffect(()=>{
    if(screen!=="host-lobby"&&screen!=="host-game")return;if(!gameCode)return;
    const poll=async()=>{
      const keys=await storageList(`game:${gameCode}:player:`,true);const pd=[];
      for(const k of keys){const d=await storageGet(k,true);if(d)pd.push(d)}
      setPlayers(pd);
    };
    poll();const iv=setInterval(poll,2000);return()=>clearInterval(iv);
  },[screen,gameCode]);

  useEffect(()=>{
    if(screen!=="host-game"||!gameCode)return;
    const slides=buildSlides(rounds,false);
    const cur=slides[slideIndex];
    if(cur)storageSet(`game:${gameCode}:state`,cur,true);
  },[slideIndex,screen,gameCode,rounds]);

  function startGame(){setSlideIndex(0);setScreen("host-game")}
  function endGame(){storageSet(`game:${gameCode}:state`,{type:"results"},true);setScreen("home")}
  function handlePlayerJoin(c,n,d){setPlayerGameCode(c);setPlayerName(n);setPlayerGameData(d);setScreen("player-game")}

  if(screen==="home")return <HomeScreen onNavigate={t=>{if(t==="builder")setScreen("builder");else if(t==="host-lobby")startHostLobby();else if(t==="player-join")setScreen("player-join")}}/>;
  if(screen==="builder")return <Builder rounds={rounds} setRounds={setRounds} onBack={()=>setScreen("home")} onStartHost={startHostLobby}/>;
  if(screen==="host-lobby")return <HostLobby rounds={rounds} gameCode={gameCode} players={players} onStart={startGame} onBack={()=>setScreen("home")}/>;
  if(screen==="host-game")return <HostPresentation rounds={rounds} gameCode={gameCode} players={players} slideIndex={slideIndex} setSlideIndex={setSlideIndex} onEnd={endGame}/>;
  if(screen==="player-join")return <PlayerJoin onJoin={handlePlayerJoin} onBack={()=>setScreen("home")}/>;
  if(screen==="player-game")return <PlayerGame gameCode={playerGameCode} playerName={playerName} playerId={playerId} initialGameData={playerGameData} onLeave={()=>setScreen("home")}/>;
  return <HomeScreen onNavigate={()=>setScreen("home")}/>;
}
