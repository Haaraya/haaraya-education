/* Haaraya worksheet engine: item ids, answer checking, suggested ratings, live book pages.
   Ratings follow the Haaraya guide: NY / D / S / B per section, help M / P / I.
   Ratings are never combined into a score or percentage. */
(function(){
"use strict";
var WS=window.HL_WS||{};
var SUPA="https://laihhrkxnxzohaiiisou.supabase.co", KEY="sb_publishable_qW4msFbGQ9QuqIZ6-G8QfA_JY_pvcsY";
var SECS=[{k:"wf",n:"Word Focus",i:1},{k:"ra",n:"Read It Again",i:2},{k:"ta",n:"Think About It",i:3},{k:"sw",n:"Show What You Know",i:4}];
var RATINGS={NY:"Not Yet",D:"Developing",S:"Secure",B:"Beyond","-":"Not observed",A:"Absent / not completed"};
var HELP={M:"Modelled",P:"Prompted",I:"Independent"};
var BOOKS={"S-01-06":8,"H-02-02":12,"TF-03-02":16,"TP-04-01":8,"TFT-05-01":12,"TD-06-01":24,"SN-07-01":32,"SP-08-01":12,"SF-09-01":40,"TN-10-02":32,"TN-11-01":32,"SN-12-01":48};

Object.keys(WS).forEach(function(c){var w=WS[c];
 w.wf.forEach(function(it,i){it.id="wf"+i;});
 w.ta.forEach(function(it,i){it.id="ta"+i;});
 w.sw.forEach(function(it,i){it.id="sw"+i;});
 if(w.ch){w.ch.id="ch";w.ch.challenge=1;}
});
function list(){return Object.keys(WS).map(function(k){return WS[k];}).sort(function(a,b){return a.level-b.level;});}
function norm(s){return String(s==null?"":s).toLowerCase().replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9' ]+/g," ").replace(/\s+/g," ").trim();}
function hasKw(v,kw){var n=" "+norm(v)+" ";return kw.some(function(k){return n.indexOf(norm(k))>=0;});}
function keyOf(a){return (Array.isArray(a)?a:[a]).map(String);}
function sortKey(v){return Array.isArray(v)?v.slice().sort().join(""):(v==null?"":String(v));}
function filled(v){return v!=null&&String(v).trim()!=="";}

/* Returns {units:[{ok:true|false|null, blank:bool, book:bool, label}], open:bool, answered:bool}
   blank = the child left this part empty. A blank is never shown as wrong: it is "not answered". */
function check(it,r){
 var U=[],open=false,ans=false;
 function u(ok,book,label,blank){U.push({ok:(blank&&ok!==null)?false:ok,blank:!!blank,book:!!book,label:label||""});}
 var isBook=function(i,first){return it.book?it.book.indexOf(i)>=0:i===(first||0);};
 switch(it.t){
  case "pick": it.lines.forEach(function(L,i){var v=(r&&r[i])||[];if(v.length)ans=true;u(sortKey(v)===sortKey(L.a),isBook(i),"Line "+(i+1),!v.length);
    var x=U[U.length-1];x.need=L.a.length;x.got=v.filter(function(n){return L.a.indexOf(n)>=0;}).length;x.extra=v.length-x.got;});break;
  case "match": it.left.forEach(function(l,i){var v=r&&r[i];if(v!=null)ans=true;u(v===it.a[i],isBook(i),l,v==null);});break;
  case "fill": var first=it.blanks.findIndex(function(b){return !b.fixed;});
   it.blanks.forEach(function(b,i){if(b.fixed)return;var v=r&&r[i];if(filled(v))ans=true;
    if(b.a==null){open=true;u(null,false,b.pre||b.pic||"Gap",!filled(v));return;}
    u(b.a.some(function(x){return norm(x)===norm(v);}),it.book?isBook(i):(i===first&&first===0),b.pic||b.pre||"Gap "+(i+1),!filled(v));});break;
  case "sort": it.words.forEach(function(w,i){var v=r&&r[i];var f=filled(sortKey(v));if(f)ans=true;u(keyOf(it.a[i]).indexOf(sortKey(v))>=0,isBook(i,-1),w,!f);});break;
  case "order": var has=!!(r&&r.length);if(has)ans=true;u(has&&r.length===it.a.length&&r.every(function(x,i){return x===it.a[i];}),false,"Order",!has);break;
  case "yesno": it.lines.forEach(function(l,i){var v=r&&r[i];if(v!=null)ans=true;u(v===it.a[i],i===0,l,v==null);});break;
  case "choose": if(r!=null)ans=true;u(r===it.a,false,it.q,r==null);break;
  case "write": var fw=filled(r);if(fw)ans=true;
   if(it.kw)u(fw&&hasKw(r,it.kw),false,it.q,!fw);else if(it.kwAll)u(fw&&it.kwAll.every(function(g){return hasKw(r,g);}),false,it.q,!fw);else{open=true;u(null,false,it.q,!fw);}
   if(it.check)open=true;break;
  case "fields": it.fields.forEach(function(f,i){var v=r&&r[i];if(filled(v))ans=true;
    if(f.kw)u(filled(v)&&(f.exact?f.kw.some(function(k){return norm(k)===norm(v);}):hasKw(v,f.kw)),false,f.l,!filled(v));else{open=true;u(null,false,f.l||"Answer",!filled(v));}});break;
  case "table": it.rows.forEach(function(row,ri){row.forEach(function(c,ci){if(typeof c==="string")return;var v=r&&r[ri]&&r[ri][ci];if(filled(v))ans=true;
    if(c&&c.kw)u(filled(v)&&hasKw(v,c.kw),false,row[0]||"Row",!filled(v));else{open=true;u(null,false,"Own row",!filled(v));}});});break;
  case "draw": var d=r||{};if(d.img||filled(d.label))ans=true;open=true;u(null,false,"Drawing",!d.img);
   if(it.kw)u(filled(d.label)&&hasKw(d.label,it.kw),false,"Label",!filled(d.label));break;
 }
 return {units:U,open:open,answered:ans};
}
/* Questions the child has left (fully or partly) empty in one part. Challenges and text are optional. */
function unanswered(w,k,resp){return secItems(w,k).filter(function(it){return !it.challenge&&it.t!=="text"&&check(it,(resp||{})[it.id]).units.some(function(x){return x.blank;});});}
function secItems(w,k){return k==="sw"?w.sw.concat(w.ch?[w.ch]:[]):(w[k]||[]);}
/* Suggest a rating from the closed items only. Teacher always confirms. */
/* Answer marks. Each part of an answer is worth 1: right 1, partly right 1/2, not yet or empty 0.
   Written answers count once the teacher marks them. Challenges are optional and never counted. */
/* Written parts (typed or drawn) can be marked by the teacher; her mark replaces the automatic check. */
var WRITTEN={write:1,fields:1,table:1,draw:1,fill:1};
function markOf(it,x,i,marks){if(x.blank)return 0;var m=marks&&marks[it.id+":"+i];if(WRITTEN[it.t]&&m!=null)return m;if(x.ok===null)return null;if(x.ok)return 1;return x.got>0?0.5:0;}
function marksScore(w,resp,marks){
 var got=0,total=0,toMark=0;
 ["wf","ta","sw"].forEach(function(k){secItems(w,k).forEach(function(it){if(it.challenge||it.t==="text")return;
  check(it,(resp||{})[it.id]).units.forEach(function(x,i){var m=markOf(it,x,i,marks);if(m==null){toMark++;return;}got+=m;total+=1;});});});
 return {got:got,total:total,toMark:toMark,pct:total?Math.round(got/total*100):null};
}
function suggest(w,k,resp,marks){
 if(k==="ra")return {r:null,note:"Rate only after hearing this child read alone."};
 var items=secItems(w,k).filter(function(it){return !it.challenge&&it.t!=="text";});
 var units=[],open=false,any=false;
 items.forEach(function(it){var c=check(it,resp[it.id]);
  c.units.forEach(function(x,i){var m=markOf(it,x,i,marks);if(m==null){open=true;return;}units.push({ok:m===1,book:x.book});});
  any=any||c.answered;});
 if(!any)return {r:null,note:"Nothing answered yet."};
 var bk=units.filter(function(x){return x.book;}),nw=units.filter(function(x){return !x.book;});
 var ok=function(a){return a.every(function(x){return x.ok;});},none=function(a){return a.every(function(x){return !x.ok;});};
 var r,note;
 if(!units.length){r=null;note="Mark the written answers with Right, Partly or Not yet, and a rating will be suggested.";}
 else if(ok(units)){r="S";note="Every checkable item is right.";}
 else if(none(units)){r="NY";note="No checkable item is right yet.";}
 else if(bk.length&&ok(bk)&&!ok(nw)){r="D";note="Book items right, new items not yet: the skill has not yet transferred.";}
 else{r="D";note=units.filter(function(x){return x.ok;}).length+" of "+units.length+" checkable items right.";}
 if(open&&units.length)note+=" Some written answers are not marked yet.";
 var ch=w.ch&&k==="sw"?check(w.ch,resp.ch):null;
 return {r:r,note:note,challenge:ch&&ch.answered};
}
/* Plausible demo responses. skill 0..1 */
function simulate(w,rnd,skill){
 var resp={};function hit(){return rnd()>(1-skill)*.3;}
 function wrongIdx(n,a){var x=Math.floor(rnd()*n);return x===a?(a+1)%n:x;}
 var pool=["wet","muddy","cold","loud","soft","a pond","grey","sticky"];
 secItems(w,"wf").concat(w.ta,secItems(w,"sw")).forEach(function(it){
  if(it.challenge&&rnd()<.6)return;
  var v;switch(it.t){
   case "pick": v=it.lines.map(function(L,i){return (i===0||hit())?L.a.slice():[Math.floor(rnd()*L.o.length)];});break;
   case "match": v=it.a.map(function(a,i){return (i===0||hit())?a:wrongIdx(it.right.length,a);});break;
   case "fill": v=it.blanks.map(function(b){return b.fixed?"":b.a==null?pool[Math.floor(rnd()*pool.length)]:(hit()?b.a[0]:(it.bank?it.bank[Math.floor(rnd()*it.bank.length)]:""));});break;
   case "sort": v=it.a.map(function(a,i){var k=keyOf(a)[0];return hit()||(it.book&&it.book.indexOf(i)>=0)?(k.length>1?k.split(""):k):String(1-+k[0]);});break;
   case "order": v=hit()?it.a.slice():it.a.slice().reverse();break;
   case "yesno": v=it.a.map(function(a,i){return i===0||hit()?a:!a;});break;
   case "choose": v=hit()?it.a:wrongIdx(it.o.length,it.a);break;
   case "write": v=it.kw&&hit()?it.kw[0]:"";break;
   case "fields": v=it.fields.map(function(f){return f.kw&&hit()?f.kw[Math.floor(rnd()*f.kw.length)]:"";});break;
   default: v=null;
  }
  if(v!=null)resp[it.id]=v;
 });
 return resp;
}
function picUrl(code,id){return SUPA+"/storage/v1/object/public/book-assets/worksheets/"+code+"/"+id+".webp";}
function coverUrl(code){return SUPA+"/storage/v1/object/public/book-assets/books/"+code+"/"+code+"_FC.webp";}
var pageCache={};
function pages(code){
 if(pageCache[code])return pageCache[code];
 pageCache[code]=fetch(SUPA+"/rest/v1/rpc/get_book_package",{method:"POST",headers:{apikey:KEY,Authorization:"Bearer "+KEY,"Content-Type":"application/json"},body:JSON.stringify({input_book_code:code})})
  .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
  .then(function(j){if(Array.isArray(j))j=j[0];if(j&&j.get_book_package)j=j.get_book_package;if(j&&j.data&&j.data.book)j=j.data;
   return (j.pages||[]).sort(function(a,b){return a.page_number-b.page_number;}).map(function(p){
    var img=p.image_path?SUPA+"/storage/v1/object/public/book-assets/"+encodeURI(String(p.image_path).replace(/^\/+/,"").replace(/^book-assets\//,"").replace(/\.png$/i,".webp")):"";
    return {n:p.page_number,img:img,text:p.display_text||p.page_text||""};});})
  .catch(function(e){delete pageCache[code];throw e;});
 return pageCache[code];
}
window.HLWS={WS:WS,list:list,get:function(c){return WS[c];},SECS:SECS,RATINGS:RATINGS,HELP:HELP,BOOK_PAGES:BOOKS,check:check,unanswered:unanswered,marksScore:marksScore,WRITTEN:WRITTEN,suggest:suggest,secItems:secItems,simulate:simulate,coverUrl:coverUrl,picUrl:picUrl,pages:pages,norm:norm};
window.HL_AUDIO=window.HL_AUDIO||{};
})();
