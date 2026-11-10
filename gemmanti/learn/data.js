/* Gemmanti — demo seed data. Fictional people, schools and scores only. */
(function(){
"use strict";
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
var R=rng(20261026);
function pick(a){return a[Math.floor(R()*a.length)];}
function ri(a,b){return a+Math.floor(R()*(b-a+1));}

var STRANDS=[
 {id:"Soundables",color:"#1565C0",bg:"#E3F2FD"},
 {id:"Soundables+",color:"#0D47A1",bg:"#E3ECFA"},
 {id:"Hafwas",color:"#C24400",bg:"#FFF3E0"},
 {id:"Tafiya Fiction",color:"#1A6E1A",bg:"#E8F5E8"},
 {id:"Tafiya Non-Fiction",color:"#00737D",bg:"#E0F4F5"},
 {id:"Tafiya Folktale",color:"#8A5A00",bg:"#FFF4D6"},
 {id:"Tafiya Poetry",color:"#6A3FA0",bg:"#F1EAFA"},
 {id:"Tafiya Duniya",color:"#3D5C3D",bg:"#EEF3EC"},
 {id:"Stamina Fiction",color:"#7A2E5A",bg:"#F8E9F1"},
 {id:"Stamina Non-Fiction",color:"#5B4A1E",bg:"#F3EEDF"}
];
var LEVELS=[];
for(var i=1;i<=15;i++)LEVELS.push({n:i,id:"L"+i,odyssey:i>=13,band:i<=3?"Early":i<=6?"Developing":i<=9?"Transitional":i<=12?"Fluent":"Odyssey"});

/* The 12 Haaraya showcase books (one per level, L1–L12). Covers and pages load live from the Haaraya library. */
var HW=window.HLWS;
var BOOKS=HW.list().map(function(w){return {id:w.code,t:w.title,s:w.strand,l:w.level,k:w.focus,img:HW.coverUrl(w.code),pages:HW.BOOK_PAGES[w.code],live:true,ws:true};});

var SCHOOLS=[
 {id:"gf",name:"Greenfield Primary School",city:"Lagos",type:"School",status:"Active",since:"Jan 2025"},
 {id:"km",name:"Kofo Memorial Academy",city:"Ibadan",type:"School",status:"Active",since:"Sep 2025"},
 {id:"um",name:"Unity Model School",city:"Abuja",type:"School",status:"Active",since:"Sep 2025"},
 {id:"kl",name:"Kano Children's Library",city:"Kano",type:"Library",status:"Active",since:"Mar 2026"},
 {id:"hs",name:"Harbour Saturday School",city:"London (diaspora)",type:"Community",status:"Pilot",since:"Jun 2026"},
 {id:"es",name:"Enugu State Reading Cohort",city:"Enugu",type:"Government cohort",status:"Onboarding",since:"Oct 2026"}
];
var TEACHERS=[
 {id:"t1",name:"Mrs Adaeze Adekunle",email:"a.adekunle@greenfield.example",schoolId:"gf",classes:["p3i","p4a"]},
 {id:"t2",name:"Mr Sani Yusuf",email:"s.yusuf@greenfield.example",schoolId:"gf",classes:["p1s"]},
 {id:"t3",name:"Mrs Halima Bello",email:"h.bello@greenfield.example",schoolId:"gf",classes:["p2c"]},
 {id:"t4",name:"Mr Tobi Ojo",email:"t.ojo@greenfield.example",schoolId:"gf",classes:["p5j"]}
];
var CLASSES=[
 {id:"p1s",name:"Primary 1 Sapphire",grade:1,teacherId:"t2",expected:2,size:22},
 {id:"p2c",name:"Primary 2 Coral",grade:2,teacherId:"t3",expected:3,size:24},
 {id:"p3i",name:"Primary 3 Ivory",grade:3,teacherId:"t1",expected:4,size:24},
 {id:"p4a",name:"Primary 4 Amber",grade:4,teacherId:"t1",expected:5,size:23},
 {id:"p5j",name:"Primary 5 Jade",grade:5,teacherId:"t4",expected:6,size:21}
];
var FIRST=["Tunde","Zainab","Chidi","Fatima","Kelechi","Ife","Musa","Ngozi","Yusuf","Bisi","Obinna","Aisha","Femi","Halima","Ikenna","Folake","Sadiq","Chiamaka","Dayo","Hauwa","Uche","Temi","Bello","Ebere","Kunle","Amina","Nnamdi","Simi","Ahmed","Adaku","Seun","Rukayya","Jide","Ifunanya","Garba","Toyin","Ejike","Maryam","Lanre","Chinwe"];
var LAST=["Bakare","Musa","Eze","Bello","Nwosu","Adeyemi","Ibrahim","Okafor","Abdullahi","Ogun","Okonkwo","Lawal","Balogun","Umar","Nnaji","Afolabi","Danjuma","Igwe","Salami","Okeke","Adamu","Ojo","Chukwu","Sule"];

var LESSON_ID="L4-U3";
var LEARNERS=[];
var nameUsed={};
function makeName(){for(var k=0;k<50;k++){var n=pick(FIRST)+" "+pick(LAST);if(!nameUsed[n]){nameUsed[n]=1;return n;}}return "Learner "+LEARNERS.length;}
function weekly(base){var a=[];for(var w=0;w<10;w++)a.push(Math.max(0,Math.round(base+(R()-.5)*base*0.9)));return a;}
CLASSES.forEach(function(c){
 for(var k=0;k<c.size;k++){
  var off=R();var lvl=c.expected+(off<.12?-2:off<.32?-1:off<.82?0:1);lvl=Math.max(1,Math.min(12,lvl));
  var active=R()<.85;
  var L={id:c.id+"-"+k,name:makeName(),classId:c.id,schoolId:"gf",level:lvl,levelPct:ri(5,90),
   lastActive:active?ri(0,4):ri(8,21),weekly:weekly(active?ri(3,8):1),
   booksDone:[],reading:{},lessons:{},worksheets:{},achievements:[],
   skills:{phonics:ri(45,98),sight:ri(45,98),vocab:ri(40,95),comp:ri(35,95),seq:ri(35,95)}};
  if(c.id==="p3i"){
   var r=R();var st=r<.45?"complete":r<.75?"in_progress":"not_started";
   var rec={status:st,step:st==="complete"?5:st==="in_progress"?ri(1,3):0,attempts:[]};
   if(st==="complete"){var sc=R()<.2?3:ri(4,6);rec.attempts.push({score:sc,total:6,pass:sc>=4,date:"2026-10-"+ri(19,24)});if(sc<4)rec.status="in_progress",rec.step=4;}
   L.lessons[LESSON_ID]=rec;
  }
  LEARNERS.push(L);
 }
});
/* Primary personas */
var amara=LEARNERS.find(function(l){return l.classId==="p3i";});
Object.assign(amara,{id:"amara",name:"Amara Obi",level:4,levelPct:58,lastActive:0,weekly:[4,5,6,5,7,6,8,7,6,7],
 skills:{phonics:92,sight:88,vocab:74,comp:69,seq:58},achievements:["first-book","ten-books","level-3"],
 booksDone:["TF-03-02","H-02-02","S-01-06"],
 reading:{"TP-04-01":{page:3,pages:8,done:false,at:"2026-10-25"}},
 lessons:{"L4-U3":{status:"in_progress",step:1,attempts:[]}}});
var emeka=LEARNERS.find(function(l){return l.classId==="p1s";});
Object.assign(emeka,{id:"emeka",name:"Emeka Obi",level:2,levelPct:31,lastActive:1,weekly:[2,3,3,4,2,3,5,4,3,4],
 skills:{phonics:81,sight:63,vocab:58,comp:55,seq:50},achievements:["first-book"],
 booksDone:["S-01-06"],
 reading:{"H-02-02":{page:4,pages:12,done:false,at:"2026-10-24"}},lessons:{}});
LEARNERS.forEach(function(l){
 if(!l.booksDone.length){var pool=BOOKS.filter(function(b){return b.l<=l.level&&b.l>=l.level-2;});var n=ri(3,14);for(var q=0;q<n&&pool.length;q++){var b=pool.splice(Math.floor(R()*pool.length),1)[0];l.booksDone.push(b.id);}}
});

/* Worksheet records: responses, then teacher ratings for some. */
[["p3i","TP-04-01"],["p4a","TFT-05-01"]].forEach(function(pair){
 var w=HW.get(pair[1]);
 LEARNERS.filter(function(l){return l.classId===pair[0]&&l.id!=="amara";}).forEach(function(l){
  var x=R();if(x<.25)return;
  var skill=Math.max(.2,Math.min(.97,.45+(l.level-w.level)*.18+R()*.4));
  var rec={status:"in_progress",resp:HW.simulate(w,R,skill),reads:[],at:"2026-11-0"+ri(4,8)};
  if(x>.45){rec.status="handed_in";}
  if(x>.6){rec.status="reviewed";var rt={};["wf","ta","sw"].forEach(function(k){var sg=HW.suggest(w,k,rec.resp);rt[k]=sg.r||"D";});
   rt.ra=skill>.75?"S":skill>.45?"D":"NY";if(rec.resp.ch&&R()<.5&&rt.sw==="S")rt.sw="B";
   rec.ratings=rt;rec.help=skill>.7?"I":skill>.45?"P":"M";rec.reviewedAt="2026-11-0"+ri(6,9);rec.reads=w.ra.reads===2?[true,true]:[true];}
  l.worksheets[pair[1]]=rec;
 });
});
var LESSON_CATALOG=[
 {id:"L1-U2",title:"Short a: cat, mat, sat",level:1,strand:"Soundables",mins:12},
 {id:"L2-U1",title:"Sight words: he, she, we",level:2,strand:"Hafwas",mins:10},
 {id:"L3-U4",title:"Who, What, Where?",level:3,strand:"Tafiya Fiction",mins:15},
 {id:"L4-U2",title:"Describing Words",level:4,strand:"Tafiya Fiction",mins:15},
 {id:"L4-U3",title:"Steps in Order",level:4,strand:"Tafiya Fiction",mins:18,playable:true},
 {id:"L4-U4",title:"Cause and Effect",level:4,strand:"Tafiya Fiction",mins:18},
 {id:"L5-U1",title:"Finding the Main Idea",level:5,strand:"Tafiya Fiction",mins:20},
 {id:"L5-U3",title:"Digraphs: sh, ch, th",level:5,strand:"Soundables",mins:12}
];
var JOURNEYS=[
 {id:"J-L4-T",title:"Level 4 · Food, Farm and Family",level:4,strand:"Tafiya Fiction",units:[
  {id:"L4-U1",title:"Who and What",done:true},
  {id:"L4-U2",title:"Describing Words",done:true},
  {id:"L4-U3",title:"Steps in Order",live:true},
  {id:"L4-U4",title:"Cause and Effect"},
  {id:"L4-U5",title:"Retelling a Story"},
  {id:"L4-U6",title:"Level 4 Check"}]},
 {id:"J-L2-S",title:"Level 2 · Sounds Together",level:2,strand:"Soundables",units:[]},
 {id:"J-L5-T",title:"Level 5 · Stories and Facts",level:5,strand:"Tafiya Fiction",units:[]}
];

/* Original placeholder lesson (not taken from any Haaraya book). */
var LESSON={
 id:LESSON_ID,title:"Steps in Order",level:4,strand:"Tafiya Fiction",unit:"Unit 3",mins:18,
 objective:"Read a how-to text and put the steps in the right order.",
 goals:["Read a short how-to text","Find the order words","Put the steps in order"],
 passageTitle:"How to Plant a Maize Seed",
 passage:[
  "Maize is a tall plant. It gives us corn to eat. You can grow maize at home. Here is how.",
  "First, find a sunny spot. Maize needs lots of sun.",
  "Next, dig a small hole in the soil. Make it as deep as your finger.",
  "Then, drop two seeds into the hole. Cover them with soil.",
  "After that, water the soil every morning. Do not give it too much water.",
  "Finally, wait and watch. In about one week, a green shoot will push up through the soil!"
 ],
 orderWords:["First","Next","Then","After that","Finally"],
 vocab:[
  {w:"soil",m:"The top layer of the ground, where plants grow"},
  {w:"seed",m:"A small part of a plant that grows into a new plant"},
  {w:"sunny",m:"Bright with light from the sun"},
  {w:"shoot",m:"A new, young part of a plant that grows up"}
 ],
 steps:["Find a sunny spot","Dig a small hole","Drop in two seeds","Water every morning","Wait for a green shoot"],
 quiz:[
  {q:"What does maize need lots of?",o:["Shade","Sun","Wind","Sand"],a:1,why:"The text says: “Maize needs lots of sun.”"},
  {q:"How deep should the hole be?",o:["As deep as your arm","As deep as a bucket","As deep as your finger","No hole is needed"],a:2,why:"“Make it as deep as your finger.”"},
  {q:"How many seeds go into the hole?",o:["One","Two","Three","Five"],a:1,why:"“Drop two seeds into the hole.”"},
  {q:"Which word tells you it is the last step?",o:["First","Next","Then","Finally"],a:3,why:"“Finally” tells us the last step."},
  {q:"What will you see in about one week?",o:["A green shoot","A corn cob","A yellow flower","A tall plant"],a:0,why:"“A green shoot will push up through the soil.”"},
  {q:"What is this text mostly about?",o:["Cooking corn","Why the sun is hot","How to grow maize","A trip to the farm"],a:2,why:"Every step tells us how to grow maize."}
 ],
 passMark:4
};
var SECTIONS=["Learn","Read","Guided","Practice","Check","Done"];

var ACHIEVEMENTS={
 "first-book":{label:"First Book",desc:"Finished your first book",glyph:"1"},
 "ten-books":{label:"Ten Books",desc:"Finished ten books",glyph:"10"},
 "level-3":{label:"Level 3",desc:"Completed Level 3",stamp:"assets/stamp-l3.png"},
 "order-finder":{label:"Order Finder",desc:"Passed Steps in Order",glyph:"123"},
 "level-4":{label:"Level 4",desc:"Completed Level 4",stamp:"assets/stamp-l4.png"}
};

var ASSIGNMENTS=[
 {id:"a1",classId:"p3i",type:"lesson",ref:"L4-U3",title:"Steps in Order",due:"2026-10-30",to:"all",created:"2026-10-19"},
 {id:"a2",classId:"p3i",type:"book",ref:"TP-04-01",title:"Sun, Then Rain",due:"2026-11-12",to:"all",created:"2026-11-03"},
 {id:"a3",classId:"p3i",type:"worksheet",ref:"TP-04-01",title:"Sun, Then Rain · worksheet",due:"2026-11-14",to:"all",created:"2026-11-03"},
 {id:"a5",classId:"p4a",type:"worksheet",ref:"TFT-05-01",title:"Clever Tortoise · worksheet",due:"2026-11-14",to:"all",created:"2026-11-02"},
 {id:"a6",classId:"p1s",type:"worksheet",ref:"H-02-02",title:"Pull, Gani, Pull! · worksheet",due:"2026-11-13",to:"all",created:"2026-11-04"},
 {id:"a4",classId:"p4a",type:"journey",ref:"J-L5-T",title:"Level 5 · Stories and Facts",due:"2026-11-14",to:"all",created:"2026-10-12"}
];
var EVENTS=[
 {at:"Yesterday 16:40",who:"Zainab",text:"passed Steps in Order · 5/6",classId:"p3i"},
 {at:"Yesterday 15:12",who:"Amara",text:"read 3 pages of Sun, Then Rain",classId:"p3i"},
 {at:"Fri 11:05",who:"Chidi",text:"handed in the Sun, Then Rain worksheet",classId:"p3i"}
];
var REQUESTS=[
 {id:"r1",kind:"New content",level:4,strand:"Tafiya Fiction",text:"More non-fiction about Nigerian food and farming at Level 4.",status:"Under review",date:"2026-10-08",by:"Mrs Adaeze Adekunle"}
];
var COLLECTIONS=[
 {id:"c-sound",name:"Soundables Core",strand:"Soundables",levels:"L1–L6",titles:126},
 {id:"c-hafwas",name:"Hafwas Sight Words",strand:"Hafwas",levels:"L1–L6",titles:104},
 {id:"c-taf-early",name:"Tafiya Early",strand:"Tafiya Fiction",levels:"L1–L6",titles:132},
 {id:"c-taf-fluent",name:"Tafiya Fluent",strand:"Tafiya Fiction",levels:"L7–L12",titles:96},
 {id:"c-odyssey",name:"Odyssey",strand:"Tafiya Fiction",levels:"L13–L15",titles:24},
 {id:"c-journeys",name:"Learning Journeys L1–L6",strand:"All",levels:"L1–L6",titles:36}
];
var ORG_STATS={
 gf:{learners:114,teachers:4,classes:5,active:86,avgGain:1.1,collections:["c-sound","c-hafwas","c-taf-early","c-journeys"]},
 km:{learners:342,teachers:14,classes:12,active:78,avgGain:0.9,collections:["c-sound","c-hafwas","c-taf-early","c-taf-fluent","c-journeys"]},
 um:{learners:510,teachers:19,classes:18,active:71,avgGain:0.8,collections:["c-sound","c-hafwas","c-taf-early","c-taf-fluent"]},
 kl:{learners:88,teachers:3,classes:4,active:64,avgGain:0.7,collections:["c-taf-early","c-taf-fluent","c-odyssey"]},
 hs:{learners:46,teachers:2,classes:3,active:82,avgGain:1.0,collections:["c-taf-early","c-odyssey"]},
 es:{learners:1240,teachers:48,classes:40,active:0,avgGain:null,collections:[]}
};
var PLATFORM_WEEKLY=[612,688,701,744,790,812,798,861,903,947];
var PLATFORM_BOOKS=[2104,2380,2412,2601,2788,2930,2875,3102,3260,3415];
var ADMIN_USERS=[
 {id:"u1",name:"Mr Chinedu Okoye",email:"head@greenfield.example",role:"School admin",org:"Greenfield Primary School",active:true},
 {id:"u2",name:"Mrs Adaeze Adekunle",email:"a.adekunle@greenfield.example",role:"Teacher",org:"Greenfield Primary School",active:true},
 {id:"u3",name:"Mrs Kemi Lawal",email:"k.lawal@kofo.example",role:"School admin",org:"Kofo Memorial Academy",active:true},
 {id:"u4",name:"Mr Ibrahim Danjuma",email:"i.danjuma@unity.example",role:"Teacher",org:"Unity Model School",active:true},
 {id:"u5",name:"Ms Grace Nnaji",email:"g.nnaji@kanolib.example",role:"School admin",org:"Kano Children's Library",active:true},
 {id:"u6",name:"Mr Femi Afolabi",email:"f.afolabi@harbour.example",role:"Teacher",org:"Harbour Saturday School",active:false},
 {id:"u7",name:"Mrs Ngozi Obi",email:"obi.family@example.com",role:"Parent",org:"—",active:true}
];
var TERM_WEEKS=["W1","W2","W3","W4","W5","W6","W7","W8","W9","W10"];

window.HL_DATA={STRANDS:STRANDS,LEVELS:LEVELS,BOOKS:BOOKS,SCHOOLS:SCHOOLS,TEACHERS:TEACHERS,CLASSES:CLASSES,LEARNERS:LEARNERS,
 LESSON:LESSON,LESSON_ID:LESSON_ID,SECTIONS:SECTIONS,LESSON_CATALOG:LESSON_CATALOG,JOURNEYS:JOURNEYS,ACHIEVEMENTS:ACHIEVEMENTS,
 ASSIGNMENTS:ASSIGNMENTS,EVENTS:EVENTS,REQUESTS:REQUESTS,COLLECTIONS:COLLECTIONS,ORG_STATS:ORG_STATS,
 PLATFORM_WEEKLY:PLATFORM_WEEKLY,PLATFORM_BOOKS:PLATFORM_BOOKS,ADMIN_USERS:ADMIN_USERS,TERM_WEEKS:TERM_WEEKS,
 PARENT:{name:"Mrs Ngozi Obi",children:["amara","emeka"]}};
})();
