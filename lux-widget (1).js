(function(){
'use strict';

// ── Config ────────────────────────────────────────────
var CFG={
  PROXY_URL:'https://lux-proxy-production.up.railway.app/api/lux-chat',
  CONFIG_URL:'https://lux-proxy-production.up.railway.app/config',
  SHOP_URL:'https://inspiredbylux.com',
  MODEL:'claude-haiku-4-5-20251001',
  MAX_TOKENS:600,
};

// ── State ─────────────────────────────────────────────
var open_=false,loading=false,seen=false;
var convo=[],answers={};
var FRAGRANCES=[],DEALS=[];
var STORE={shipping:'Free shipping on orders over $50',return_policy:'Satisfaction guaranteed within 30 days'};

// ── Load config from proxy ────────────────────────────
function loadConfig(){
  fetch(CFG.CONFIG_URL).then(function(r){return r.json();}).then(function(d){
    var raw=d.products||d.services||[];
    FRAGRANCES=raw.map(function(r){
      return{
        id:r.handle||r.id, name:r.name, handle:r.handle,
        collection:r.collection||r.category||'unisex',
        onSale:!!r.onSale||!!r.on_sale,
        description:r.description||'',
        notes:{top:r.notes&&r.notes.top?r.notes.top:[],heart:r.notes&&r.notes.heart?r.notes.heart:[],base:r.notes&&r.notes.base?r.notes.base:[]},
        scent_profile:r.scent_profile||[],
        occasion:r.occasion||[],
        strength:r.strength||'moderate',
        tags:r.tags||[],
        sizes:r.sizes||[],
      };
    });
    DEALS=(d.deals||[]).map(function(d){
      return{id:d.id,name:d.name,description:d.description,cta:d.cta,shopUrl:d.shopUrl||d.url||''};
    });
  }).catch(function(){});
}

// ── Inject fonts ──────────────────────────────────────
var fl=document.createElement('link');
fl.rel='preconnect';fl.href='https://fonts.googleapis.com';document.head.appendChild(fl);
var fl2=document.createElement('link');
fl2.href='https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&display=swap';
fl2.rel='stylesheet';document.head.appendChild(fl2);

// ── Inject styles ─────────────────────────────────────
var s=document.createElement('style');
s.textContent=':root{--lx-black:#0a0a0a;--lx-dark:#1a1a1a;--lx-mid:#2a2a2a;--lx-border:#3a3a3a;--lx-muted:#888;--lx-light:#ccc;--lx-white:#f9f7f4;--lx-gold:#c9a84c;--lx-gold-light:#e0c97a;--lx-gold-pale:rgba(201,168,76,.12);--lx-panel:#141414;--lx-card:#1e1e1e;--lx-deal-bg:#1a1500;--lx-sab:env(safe-area-inset-bottom,0px);--lx-sat:env(safe-area-inset-top,0px);--lx-touch:44px;--lx-rlg:20px;--lx-rmd:14px;--lx-rsm:10px;--lx-fd:"Cormorant Garamond",Georgia,serif;--lx-fu:"Inter",system-ui,sans-serif;}'
+'#lux-btn{position:fixed;bottom:calc(20px + var(--lx-sab));right:20px;width:58px;height:58px;border-radius:50%;background:linear-gradient(135deg,#c9a84c,#8b6914);box-shadow:0 4px 20px rgba(0,0,0,.5),0 0 0 3px rgba(201,168,76,.2);display:flex;align-items:center;justify-content:center;z-index:99998;transition:transform .2s,box-shadow .2s;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}'
+'#lux-btn:hover{transform:scale(1.06);}#lux-btn:active{transform:scale(.96);}#lux-btn.lx-open{background:var(--lx-mid);}'
+'#lux-btn .lx-ico-open{font-size:22px;color:var(--lx-black);}#lux-btn .lx-ico-close{font-size:20px;color:var(--lx-muted);display:none;}'
+'#lux-btn.lx-open .lx-ico-open{display:none;}#lux-btn.lx-open .lx-ico-close{display:block;}'
+'@keyframes lx-pulse{0%{transform:scale(.9);opacity:.8}70%{transform:scale(1.5);opacity:0}100%{transform:scale(1.5);opacity:0}}'
+'#lux-btn::before{content:"";position:absolute;width:100%;height:100%;border-radius:50%;border:2px solid var(--lx-gold);animation:lx-pulse 2s ease-out 1s infinite;pointer-events:none;}'
+'#lux-btn.lx-seen::before{animation:none;}'
+'#lux-veil{position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(3px);z-index:99998;opacity:0;pointer-events:none;transition:opacity .3s;}'
+'#lux-veil.lx-on{opacity:1;pointer-events:all;}'
+'#lux-box{position:fixed;z-index:99999;display:flex;flex-direction:column;background:var(--lx-panel);border:1px solid var(--lx-border);overflow:hidden;bottom:calc(90px + var(--lx-sab));right:20px;width:380px;height:600px;border-radius:var(--lx-rlg);box-shadow:0 20px 60px rgba(0,0,0,.7);transform:translateY(30px) scale(.96);opacity:0;pointer-events:none;transition:transform .32s cubic-bezier(.34,1.2,.64,1),opacity .25s;}'
+'#lux-box.lx-on{transform:translateY(0) scale(1);opacity:1;pointer-events:all;}'
+'@media(max-width:479px){#lux-box{bottom:0;right:0;left:0;width:100%;height:92dvh;max-height:92dvh;border-radius:var(--lx-rlg) var(--lx-rlg) 0 0;border-bottom:none;transform:translateY(100%);opacity:1;}#lux-box.lx-on{transform:translateY(0);}#lux-btn{bottom:calc(16px + var(--lx-sab));right:16px;width:54px;height:54px;}}'
+'#lux-hd{flex-shrink:0;background:var(--lx-black);border-bottom:1px solid var(--lx-border);padding:14px 16px 12px;}'
+'.lx-hrow{display:flex;align-items:center;gap:12px;}'
+'.lx-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--lx-gold),#8b6914);display:flex;align-items:center;justify-content:center;font-family:var(--lx-fd);font-size:18px;color:var(--lx-black);font-weight:600;flex-shrink:0;}'
+'.lx-hn{font-family:var(--lx-fd);font-size:16px;color:var(--lx-white);letter-spacing:.03em;}'
+'.lx-hs{font-size:11px;color:var(--lx-gold);display:flex;align-items:center;gap:5px;margin-top:1px;font-family:var(--lx-fu);}'
+'@keyframes lx-blink{0%,100%{opacity:1}50%{opacity:.4}}'
+'.lx-dot{width:6px;height:6px;background:#4caf50;border-radius:50%;animation:lx-blink 2s infinite;}'
+'#lux-x{width:36px;height:36px;border-radius:50%;background:var(--lx-mid);color:var(--lx-muted);font-size:18px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;cursor:pointer;transition:background .2s,color .2s;-webkit-tap-highlight-color:transparent;}'
+'#lux-x:hover{background:var(--lx-border);color:var(--lx-white);}'
+'#lux-msgs{flex:1;overflow-y:auto;overflow-x:hidden;padding:16px 14px 8px;display:flex;flex-direction:column;gap:10px;scroll-behavior:smooth;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}'
+'#lux-msgs::-webkit-scrollbar{width:3px;}#lux-msgs::-webkit-scrollbar-thumb{background:var(--lx-border);border-radius:2px;}'
+'@keyframes lx-mi{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}'
+'.lx-msg{display:flex;align-items:flex-end;gap:8px;max-width:92%;animation:lx-mi .25s ease;}'
+'.lx-msg.lx-b{align-self:flex-start;}.lx-msg.lx-u{align-self:flex-end;flex-direction:row-reverse;}'
+'.lx-mav{width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,var(--lx-gold),#8b6914);display:flex;align-items:center;justify-content:center;font-family:var(--lx-fd);font-size:12px;color:var(--lx-black);font-weight:600;flex-shrink:0;margin-bottom:2px;}'
+'.lx-msg.lx-u .lx-mav{display:none;}'
+'.lx-mb{padding:10px 14px;border-radius:16px;font-family:var(--lx-fu);font-size:14px;line-height:1.5;color:var(--lx-white);}'
+'.lx-msg.lx-b .lx-mb{background:var(--lx-card);border-bottom-left-radius:4px;}'
+'.lx-msg.lx-u .lx-mb{background:linear-gradient(135deg,var(--lx-gold),#8b6914);color:var(--lx-black);font-weight:500;border-bottom-right-radius:4px;}'
+'.lx-tdots{display:flex;gap:4px;padding:8px 4px;align-items:center;}'
+'@keyframes lx-bn{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}'
+'.lx-tdots span{width:7px;height:7px;border-radius:50%;background:var(--lx-gold);animation:lx-bn 1.2s ease infinite;}'
+'.lx-tdots span:nth-child(2){animation-delay:.18s;}.lx-tdots span:nth-child(3){animation-delay:.36s;}'
+'.lx-dc{background:var(--lx-deal-bg);border:1px solid rgba(201,168,76,.27);border-radius:var(--lx-rmd);padding:12px 14px;margin:4px 0;animation:lx-mi .3s ease;}'
+'.lx-dcb{display:inline-block;background:linear-gradient(135deg,var(--lx-gold),#8b6914);color:var(--lx-black);font-family:var(--lx-fu);font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:3px 8px;border-radius:20px;margin-bottom:6px;}'
+'.lx-dcn{font-family:var(--lx-fd);font-size:15px;color:var(--lx-white);font-weight:500;margin-bottom:4px;}'
+'.lx-dcd{font-family:var(--lx-fu);font-size:12px;color:var(--lx-light);line-height:1.5;margin-bottom:10px;}'
+'.lx-dca{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--lx-gold),#8b6914);color:var(--lx-black);font-family:var(--lx-fu);font-size:12px;font-weight:700;padding:8px 14px;border-radius:var(--lx-rsm);cursor:pointer;border:none;min-height:36px;-webkit-tap-highlight-color:transparent;}'
+'.lx-dca:hover{filter:brightness(1.1);}'
+'.lx-cw{width:100%;overflow:hidden;padding:2px 0 4px;}'
+'.lx-cr{display:flex;gap:10px;overflow-x:auto;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding:4px 2px 10px;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:var(--lx-gold) var(--lx-mid);}'
+'.lx-cr::-webkit-scrollbar{height:4px;}.lx-cr::-webkit-scrollbar-thumb{background:linear-gradient(90deg,var(--lx-gold),#8b6914);border-radius:2px;}'
+'.lx-pc{width:clamp(190px,58vw,220px);flex-shrink:0;scroll-snap-align:start;background:var(--lx-card);border:1px solid var(--lx-border);border-radius:var(--lx-rmd);overflow:hidden;display:flex;flex-direction:column;transition:border-color .2s;}'
+'.lx-pc:hover{border-color:var(--lx-gold);}'
+'.lx-pi{width:100%;height:110px;object-fit:cover;background:var(--lx-mid);display:block;}'
+'.lx-pp{width:100%;height:110px;background:linear-gradient(135deg,var(--lx-mid),var(--lx-dark));display:flex;align-items:center;justify-content:center;font-size:32px;color:var(--lx-gold);}'
+'.lx-cb{padding:10px 10px 8px;flex:1;display:flex;flex-direction:column;gap:4px;}'
+'.lx-cn{font-family:var(--lx-fd);font-size:15px;color:var(--lx-white);font-weight:500;letter-spacing:.02em;line-height:1.2;}'
+'.lx-cp{font-family:var(--lx-fu);font-size:13px;color:var(--lx-gold);font-weight:600;}'
+'.lx-cp .lx-was{text-decoration:line-through;color:var(--lx-muted);margin-right:4px;font-weight:400;}'
+'.lx-cs{display:flex;gap:4px;flex-wrap:wrap;margin:4px 0 2px;}'
+'.lx-sb{padding:3px 8px;border:1px solid var(--lx-border);border-radius:20px;font-family:var(--lx-fu);font-size:11px;color:var(--lx-muted);background:none;cursor:pointer;transition:all .15s;min-height:28px;display:flex;align-items:center;-webkit-tap-highlight-color:transparent;}'
+'.lx-sb.lx-on{border-color:var(--lx-gold);color:var(--lx-gold);background:var(--lx-gold-pale);}'
+'.lx-ca{display:flex;gap:6px;margin-top:6px;}'
+'.lx-bv{flex:1;height:var(--lx-touch);border:1px solid var(--lx-border);border-radius:var(--lx-rsm);font-size:12px;font-weight:500;color:var(--lx-light);background:none;transition:all .15s;text-decoration:none;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent;}'
+'.lx-bv:hover{background:var(--lx-mid);color:var(--lx-white);}'
+'.lx-bc{flex:1.5;height:var(--lx-touch);border-radius:var(--lx-rsm);font-size:12px;font-weight:600;color:var(--lx-black);background:linear-gradient(135deg,var(--lx-gold),#8b6914);transition:all .15s;border:none;cursor:pointer;-webkit-tap-highlight-color:transparent;}'
+'.lx-bc:hover{filter:brightness(1.1);}.lx-bc.lx-adding{opacity:.7;pointer-events:none;}.lx-bc.lx-added{background:#2d6a2d;color:#fff;}'
+'@keyframes lx-pop{0%{transform:scale(1)}40%{transform:scale(1.06)}100%{transform:scale(1)}}'
+'.lx-bc.lx-added{animation:lx-pop .3s ease;}'
+'#lux-chips-wrap{flex-shrink:0;padding:6px 14px 8px;overflow-x:auto;overflow-y:hidden;-webkit-overflow-scrolling:touch;scrollbar-width:thin;scrollbar-color:var(--lx-gold) var(--lx-mid);}'
+'#lux-chips-wrap::-webkit-scrollbar{height:4px;}.lx-chips{display:flex;gap:6px;width:max-content;}'
+'.lx-chip{white-space:nowrap;padding:8px 14px;border:1px solid var(--lx-border);border-radius:20px;font-family:var(--lx-fu);font-size:13px;color:var(--lx-light);background:var(--lx-mid);transition:all .15s;min-height:var(--lx-touch);display:flex;align-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent;}'
+'.lx-chip:hover{border-color:var(--lx-gold);color:var(--lx-gold);background:var(--lx-gold-pale);}.lx-chip:active{transform:scale(.95);}'
+'#lux-inp-row{flex-shrink:0;display:flex;align-items:center;gap:8px;padding:10px 14px calc(10px + var(--lx-sab));border-top:1px solid var(--lx-border);background:var(--lx-black);}'
+'#lux-inp{flex:1;height:var(--lx-touch);background:var(--lx-mid);border:1px solid var(--lx-border);border-radius:22px;padding:0 16px;font-size:16px;color:var(--lx-white);transition:border-color .2s;outline:none;-webkit-appearance:none;}'
+'#lux-inp::placeholder{color:var(--lx-muted);}#lux-inp:focus{border-color:var(--lx-gold);}'
+'#lux-send{width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,var(--lx-gold),#8b6914);color:var(--lx-black);font-size:17px;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:none;cursor:pointer;transition:transform .15s,filter .15s;-webkit-tap-highlight-color:transparent;}'
+'#lux-send:hover{filter:brightness(1.1);}#lux-send:active{transform:scale(.92);}#lux-send:disabled{opacity:.4;pointer-events:none;}'
+'#lux-ft{flex-shrink:0;text-align:center;padding:4px 0 6px;font-family:var(--lx-fu);font-size:10px;color:var(--lx-border);letter-spacing:.05em;background:var(--lx-black);}'
+'.lx-qp{display:flex;gap:4px;margin-bottom:4px;}.lx-qd{flex:1;height:3px;background:var(--lx-border);border-radius:2px;transition:background .3s;}'
+'.lx-qd.lx-done{background:var(--lx-gold);}.lx-qd.lx-active{background:var(--lx-gold-light);}';
document.head.appendChild(s);

// ── Build HTML ────────────────────────────────────────
var veil=document.createElement('div');veil.id='lux-veil';document.body.appendChild(veil);

var btn=document.createElement('button');btn.id='lux-btn';btn.setAttribute('aria-label','Open Lux Fragrance Advisor');
btn.innerHTML='<span class="lx-ico-open">✦</span><span class="lx-ico-close">✕</span>';
document.body.appendChild(btn);

var box=document.createElement('div');box.id='lux-box';box.setAttribute('role','dialog');
box.innerHTML='<div id="lux-hd"><div class="lx-hrow"><div class="lx-av">L</div><div class="lx-hi" style="flex:1;min-width:0"><div class="lx-hn">Lux</div><div class="lx-hs"><span class="lx-dot"></span>Fragrance Advisor</div></div><button id="lux-x">✕</button></div></div>'
+'<div id="lux-msgs" role="log" aria-live="polite"></div>'
+'<div id="lux-chips-wrap"><div id="lux-chips" class="lx-chips"></div></div>'
+'<div id="lux-inp-row"><input id="lux-inp" type="text" placeholder="Ask anything about fragrance…" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="send"/><button id="lux-send">➤</button></div>'
+'<div id="lux-ft">Powered by Lux AI ✦</div>';
document.body.appendChild(box);

var msgs=document.getElementById('lux-msgs');
var ch=document.getElementById('lux-chips');
var inp=document.getElementById('lux-inp');
var send=document.getElementById('lux-send');

// ── Toggle ────────────────────────────────────────────
function show(){
  open_=true;
  btn.classList.add('lx-open','lx-seen');seen=true;
  box.classList.add('lx-on');veil.classList.add('lx-on');
  setTimeout(function(){inp.focus();},300);
  if(!msgs.children.length)startQuiz();
}
function hide(){
  open_=false;
  btn.classList.remove('lx-open');
  box.classList.remove('lx-on');veil.classList.remove('lx-on');
}
btn.addEventListener('click',function(){open_?hide():show();});
document.getElementById('lux-x').addEventListener('click',hide);
veil.addEventListener('click',hide);
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&open_)hide();});

// ── Quiz ──────────────────────────────────────────────
var QUIZ=[
  {id:'who',q:'Who is this fragrance for?',opts:[{l:'👨 For me — masculine',v:'masculine'},{l:'👩 For me — feminine',v:'feminine'},{l:'🎁 A gift for him',v:'masculine'},{l:'🎁 A gift for her',v:'feminine'},{l:'🌿 Unisex / open',v:'unisex'}]},
  {id:'vibe',q:'What\'s the vibe?',opts:[{l:'🌊 Fresh & clean',v:'fresh'},{l:'🌸 Floral & romantic',v:'floral'},{l:'🔥 Bold & spicy',v:'spicy'},{l:'🍋 Citrus & zesty',v:'citrus'},{l:'🌙 Deep & mysterious',v:'oriental'},{l:'🌿 Woody & earthy',v:'woody'}]},
  {id:'strength',q:'How loud do you want it?',opts:[{l:'☁️ Subtle — close range',v:'light'},{l:'✨ Balanced — noticeable',v:'moderate'},{l:'💥 Bold — makes a statement',v:'bold'}]},
  {id:'occasion',q:'When will you wear it most?',opts:[{l:'🏢 Daily / office',v:'office'},{l:'🌙 Evenings & special occasions',v:'evening'},{l:'☀️ Casual & weekend',v:'casual'},{l:'🏖️ Summer & outdoors',v:'summer'}]},
  {id:'budget',q:'Any size preference?',opts:[{l:'✨ Pocket spray — try it first ($18)',v:'pocket'},{l:'💛 50ml — perfect size ($39)',v:'50ml'},{l:'💎 100ml — full bottle ($69)',v:'100ml'},{l:'No preference — show me all',v:'any'}]},
];

function startQuiz(){
  convo=[];answers={};
  typing(400,function(){
    botMsg('Welcome to Inspired By Lux ✦\n\nI\'m Lux, your personal fragrance advisor. Let me help you find your perfect scent.');
    setTimeout(function(){quiz(0);},500);
  });
}

function quiz(step){
  if(step>=QUIZ.length){recommend();return;}
  var q=QUIZ[step];
  var prog='<div class="lx-qp">'+QUIZ.map(function(_,i){return '<div class="lx-qd'+(i<step?' lx-done':i===step?' lx-active':'')+'"></div>';}).join('')+'</div>';
  typing(300,function(){
    botMsg(prog+q.q);
    chips(q.opts.map(function(o){return{t:o.l,fn:function(){
      noChips();answers[q.id]=o.v;userMsg(o.l);quiz(step+1);
    }};}));
  });
}

function recommend(){
  var col=answers.who||'unisex';
  var vibe=answers.vibe||'fresh';
  var str=answers.strength||'moderate';

  var pool=FRAGRANCES.filter(function(f){
    return col==='unisex'||(f.collection===col||f.collection==='unisex');
  });

  var scored=pool.map(function(f){
    var score=0;
    if(f.scent_profile&&f.scent_profile.some(function(p){return p.includes(vibe)||vibe.includes(p);}))score+=3;
    if(f.strength===str)score+=2;
    if(f.tags&&f.tags.includes('bestseller'))score+=1;
    if(f.onSale)score+=1;
    return{f:f,score:score};
  });
  scored.sort(function(a,b){return b.score-a.score;});
  var recs=scored.slice(0,3).map(function(x){return x.f;});

  if(!recs.length){
    typing(400,function(){botMsg('I\'d love to help — let me know what you\'re looking for and I\'ll find something perfect!');});
    return;
  }

  typing(500,function(){
    botMsg('Here are my top picks for you ✦');
    setTimeout(function(){showCards(recs);},300);
    setTimeout(function(){
      showDeal(DEALS[0]);
      chips([
        {t:'💛 Refine my picks',fn:function(){noChips();convo=[];answers={};quiz(0);}},
        {t:'🔥 What\'s on sale?',fn:function(){noChips();aiChat("What's on sale right now?");}},
        {t:'🎁 Shop gifts',fn:function(){noChips();aiChat('Help me find a gift');}}
      ]);
    },800);
  });
}

// ── Product cards ─────────────────────────────────────
function showCards(frags){
  var cr=mk('div','lx-cr');
  frags.forEach(function(f){cr.appendChild(buildCard(f));});
  var cw=mk('div','lx-cw');cw.appendChild(cr);
  var row=botRow(cw);msgs.appendChild(row);scrollBot();
  frags.forEach(function(f){fetchImg(f,cr);});
}

function buildCard(f){
  var pc=mk('div','lx-pc');
  var sizes=f.sizes||[];
  var firstSize=sizes[0]||{label:'50ml',price:39};
  var selSize=firstSize;

  var imgEl=mk('div','lx-pp');imgEl.textContent='✦';
  pc.appendChild(imgEl);

  var cb=mk('div','lx-cb');
  var cn=mk('div','lx-cn');cn.textContent=f.name;cb.appendChild(cn);

  var cp=mk('div','lx-cp');
  if(f.onSale&&sizes.length>1){
    cp.innerHTML='<span class="lx-was">$'+sizes[1].price+'</span>$'+firstSize.price;
  } else {
    cp.textContent='from $'+firstSize.price;
  }
  cb.appendChild(cp);

  if(sizes.length>1){
    var cs=mk('div','lx-cs');
    sizes.forEach(function(sz){
      var sb=mk('button','lx-sb'+(sz.label===firstSize.label?' lx-on':''));
      sb.textContent=sz.label;
      sb.addEventListener('click',function(){
        selSize=sz;
        cs.querySelectorAll('.lx-sb').forEach(function(b){b.classList.remove('lx-on');});
        sb.classList.add('lx-on');
        if(f.onSale){cp.innerHTML='<span class="lx-was">$'+sizes[1].price+'</span>$'+sz.price;}
        else{cp.textContent='$'+sz.price;}
      });
      cs.appendChild(sb);
    });
    cb.appendChild(cs);
  }

  var ca=mk('div','lx-ca');
  var bv=document.createElement('a');bv.className='lx-bv';bv.textContent='View';
  bv.href=CFG.SHOP_URL+'/products/'+f.handle;bv.target='_blank';
  ca.appendChild(bv);

  var bc=mk('button','lx-bc');bc.textContent='Add to Cart';
  bc.addEventListener('click',function(){
    if(bc.classList.contains('lx-adding')||bc.classList.contains('lx-added'))return;
    bc.classList.add('lx-adding');bc.textContent='Adding…';
    addToCart(f,selSize,bc);
  });
  ca.appendChild(bc);
  cb.appendChild(ca);
  pc.appendChild(cb);
  return pc;
}

async function fetchImg(f,cr){
  try{
    var r=await fetch(CFG.SHOP_URL+'/products/'+f.handle+'.json');
    if(!r.ok)return;
    var d=await r.json();
    var img=d.product&&d.product.images&&d.product.images[0]&&d.product.images[0].src;
    if(!img)return;
    cr.querySelectorAll('.lx-pc').forEach(function(pc){
      var pp=pc.querySelector('.lx-pp');
      var cn=pc.querySelector('.lx-cn');
      if(pp&&cn&&cn.textContent===f.name){
        var im=document.createElement('img');im.className='lx-pi';im.src=img;im.alt=f.name;
        pp.replaceWith(im);
      }
    });
  }catch(e){}
}

async function addToCart(f,size,btn){
  try{
    var pr=await fetch(CFG.SHOP_URL+'/products/'+f.handle+'.json');
    if(!pr.ok)throw new Error();
    var pd=await pr.json();
    var variants=pd.product&&pd.product.variants||[];
    var variant=variants.find(function(v){return v.title&&v.title.toLowerCase().includes(size.label.toLowerCase());});
    if(!variant)variant=variants[0];
    if(!variant)throw new Error();
    var cr=await fetch(CFG.SHOP_URL+'/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:variant.id,quantity:1})});
    if(!cr.ok)throw new Error();
    btn.classList.remove('lx-adding');btn.classList.add('lx-added');btn.textContent='Added ✓';
    setTimeout(function(){botMsg('Added to cart! 🛒 <a href="'+CFG.SHOP_URL+'/cart" style="color:var(--lx-gold)">View your cart →</a>');},300);
  }catch(e){
    btn.classList.remove('lx-adding');btn.textContent='Add to Cart';
    botMsg('Visit <a href="'+CFG.SHOP_URL+'/products/'+f.handle+'" target="_blank" style="color:var(--lx-gold)">'+f.name+'</a> to add to your cart.');
  }
}

// ── Deal card ─────────────────────────────────────────
function showDeal(deal){
  if(!deal)return;
  var d=mk('div','lx-dc');
  d.innerHTML='<div class="lx-dcb">Special Offer</div><div class="lx-dcn">'+deal.name+'</div><div class="lx-dcd">'+deal.description+'</div>';
  var a=mk('button','lx-dca');a.textContent=deal.cta+' →';
  a.addEventListener('click',function(){window.open(CFG.SHOP_URL+(deal.shopUrl||deal.url||''),'_blank');});
  d.appendChild(a);
  msgs.appendChild(botRow(d));scrollBot();
}

// ── AI Chat ───────────────────────────────────────────
function sysprompt(){
  var fl=FRAGRANCES.map(function(f){
    return f.name+'('+f.collection+','+f.strength+(f.onSale?' SALE':'')+')'+'—'+f.description;
  }).join('\n');
  var dl=DEALS.map(function(d){return d.name+': '+d.description;}).join('\n');
  return 'You are Lux, a warm fragrance advisor for Inspired By Lux (inspiredbylux.com).\n\nCRITICAL: NEVER say "inspired by", "dupe of", "similar to", or "smells like" any other brand. Legal requirement. Describe scents by their own notes only. Keep responses to 2-4 sentences.\n\nPRODUCT CARDS — MANDATORY RULE: Whenever you recommend or mention specific products, you MUST end your reply with a line in EXACTLY this format (no exceptions):\n[PRODUCTS: Product Name 1, Product Name 2, Product Name 3]\nUse the exact product names from the inventory. Max 3 products. If answering a question that doesn\'t involve specific products (e.g. shipping policy, general question), omit the [PRODUCTS] line.\n\nACTIVE PROMOTION — PUSH THIS FIRST: Buy any 2 x 50ml bottles, get a 3rd 50ml FREE. Mention it when customer considers 50ml or multiple fragrances.\n\nSTORE: '+STORE.shipping+' | '+STORE.return_policy+'\nDEALS:\n'+dl+'\nINVENTORY:\n'+fl;
}

async function aiChat(text){
  if(!text.trim()||loading)return;
  userMsg(text);noChips();inp.value='';loading=true;send.disabled=true;
  var t=showTyping();
  try{
    convo.push({role:'user',content:text});
    var r=await fetch(CFG.PROXY_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:CFG.MODEL,max_tokens:CFG.MAX_TOKENS,system:sysprompt(),messages:convo.slice(-12)})});
    if(!r.ok)throw new Error(r.status);
    var d=await r.json();
    var fullReply=d.content&&d.content[0]&&d.content[0].text||'';

    // Extract [PRODUCTS: ...] tag and clean it from visible text
    var productMatch=fullReply.match(/\[PRODUCTS:\s*([^\]]+)\]/i);
    var cleanReply=fullReply.replace(/\[PRODUCTS:[^\]]+\]/i,'').trim();

    convo.push({role:'assistant',content:fullReply});
    t.remove();
    if(cleanReply)botMsg(cleanReply);

    // Show product cards if bot included [PRODUCTS: ...]
    if(productMatch){
      var names=productMatch[1].split(',').map(function(n){return n.trim().toLowerCase();});
      var hits=FRAGRANCES.filter(function(f){
        return names.some(function(n){return f.name.toLowerCase()===n||f.name.toLowerCase().includes(n)||n.includes(f.name.toLowerCase());});
      }).slice(0,3);
      if(hits.length){
        setTimeout(function(){showCards(hits);},200);
        setTimeout(function(){
          chips([
            {t:'🛒 View more',fn:function(){noChips();aiChat('Show me more options like these');}},
            {t:'🔁 Retake quiz',fn:function(){noChips();convo=[];answers={};quiz(0);}},
            {t:'🎁 Shop gifts',fn:function(){noChips();aiChat('Help me find a gift');}}
          ]);
        },400);
        return;
      }
    }

    // Fallback: scan reply text for product names
    var textHits=FRAGRANCES.filter(function(f){return cleanReply.toLowerCase().includes(f.name.toLowerCase());});
    if(textHits.length){
      setTimeout(function(){showCards(textHits.slice(0,3));},200);
    }

    chips([
      {t:'💛 Find my scent',fn:function(){noChips();convo=[];answers={};quiz(0);}},
      {t:'🔥 What\'s on sale?',fn:function(){noChips();aiChat("What's on sale?");}},
      {t:'🎁 Shop gifts',fn:function(){noChips();aiChat('Help me find a gift');}}
    ]);
  }catch(e){
    t.remove();botMsg('I\'m having trouble connecting. Try again in a moment!');
  }finally{loading=false;send.disabled=false;}
}

send.addEventListener('click',function(){aiChat(inp.value.trim());});
inp.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();aiChat(inp.value.trim());}});

// ── Helpers ───────────────────────────────────────────
function mk(tag,cls){var e=document.createElement(tag);if(cls)e.className=cls;return e;}
function botRow(content){var r=mk('div','lx-msg lx-b');var a=mk('div','lx-mav');a.textContent='L';r.appendChild(a);var w=mk('div');w.style.cssText='display:flex;flex-direction:column;gap:6px;max-width:100%;min-width:0;';w.appendChild(content);r.appendChild(w);return r;}
function botMsg(text){var b=mk('div','lx-mb');b.style.maxWidth='100%';b.innerHTML=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');msgs.appendChild(botRow(b));scrollBot();return b;}
function userMsg(text){var r=mk('div','lx-msg lx-u');var b=mk('div','lx-mb');b.textContent=text;r.appendChild(b);msgs.appendChild(r);scrollBot();}
function showTyping(){var r=mk('div','lx-msg lx-b');var a=mk('div','lx-mav');a.textContent='L';var b=mk('div','lx-mb');b.innerHTML='<div class="lx-tdots"><span></span><span></span><span></span></div>';r.appendChild(a);r.appendChild(b);msgs.appendChild(r);scrollBot();return r;}
function typing(ms,cb){var t=showTyping();setTimeout(function(){t.remove();cb();},ms);}
function chips(list){ch.innerHTML='';list.forEach(function(o){var b=mk('button','lx-chip');b.textContent=o.t;b.addEventListener('click',o.fn);ch.appendChild(b);});document.getElementById('lux-chips-wrap').scrollLeft=0;}
function noChips(){ch.innerHTML='';}
function scrollBot(){requestAnimationFrame(function(){msgs.scrollTop=msgs.scrollHeight;});}

// Mobile viewport
if(window.visualViewport){window.visualViewport.addEventListener('resize',function(){if(window.innerWidth<=479&&open_){box.style.height=window.visualViewport.height+'px';scrollBot();}});}

loadConfig();
})();
