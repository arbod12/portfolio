/* ============================================================
   Ariel Bodik — site-wide background music player
   ------------------------------------------------------------
   How it works:
   - Each page sets two globals BEFORE this script loads:
       window.SITE_PAGE      = 'home' | 'ledgerlens' | ... (a key)
       window.SITE_PLAYLISTS = { home:[{title,artist,src}], ... }
     (see playlists.js)
   - This script renders a small floating player (bottom-left),
     loads the playlist for the current page, and gives you
     play / pause / stop / next / prev / shuffle / volume.
   - Nothing autoplays with sound until you press play (browsers
     block autoplay audio anyway). Volume + shuffle are remembered
     across pages via localStorage.
   - 100% client-side. No tracking, no network calls except
     fetching the audio files you host.
   ============================================================ */
(function(){
  if(window.__sitePlayerLoaded) return; window.__sitePlayerLoaded=true;

  var PAGE = window.SITE_PAGE || 'home';
  var ALL  = window.SITE_PLAYLISTS || {};
  var list = (ALL[PAGE] || ALL['home'] || []).slice();

  // ---- persisted prefs ----
  function getNum(k,d){ var v=parseFloat(localStorage.getItem(k)); return isNaN(v)?d:v; }
  var vol     = getNum('ab_player_vol', 0.6);
  var shuffle = localStorage.getItem('ab_player_shuffle')==='1';

  // ---- audio element ----
  var audio = new Audio();
  audio.preload = 'none';
  audio.volume = vol;

  var order = list.map(function(_,i){return i;});
  var pos = 0;            // index into "order"
  var playing = false;

  function shuffleOrder(keepCurrent){
    var cur = order[pos];
    for(var i=order.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=order[i];order[i]=order[j];order[j]=t;}
    if(keepCurrent){ var ci=order.indexOf(cur); var t=order[0];order[0]=order[ci];order[ci]=t; pos=0; }
  }
  if(shuffle && order.length) shuffleOrder(false);

  // ---- UI ----
  var css = ''
   + '#abplayer{position:fixed;left:18px;bottom:18px;z-index:9999;width:288px;'
   + 'font-family:-apple-system,BlinkMacSystemFont,"Familjen Grotesk",sans-serif;'
   + 'background:rgba(21,21,31,.92);backdrop-filter:blur(14px);border:1px solid #26263a;'
   + 'border-radius:16px;box-shadow:0 18px 44px rgba(0,0,0,.5);color:#f4f4f8;'
   + 'transform:translateY(0);transition:transform .25s ease,opacity .25s ease;overflow:hidden}'
   + '#abplayer.min{transform:translateY(calc(100% - 46px))}'
   + '#abplayer.empty{display:none}'
   + '#abp-bar{display:flex;align-items:center;gap:8px;padding:11px 13px;cursor:pointer;user-select:none}'
   + '#abp-eq{display:flex;align-items:flex-end;gap:2px;width:18px;height:16px;flex-shrink:0}'
   + '#abp-eq i{flex:1;background:#3affe0;border-radius:1px;height:4px;transition:height .2s}'
   + '#abplayer.on #abp-eq i{animation:abpeq .9s ease-in-out infinite}'
   + '#abp-eq i:nth-child(2){animation-delay:.15s}#abp-eq i:nth-child(3){animation-delay:.3s}'
   + '@keyframes abpeq{0%,100%{height:4px}50%{height:15px}}'
   + '#abp-now{flex:1;min-width:0}#abp-title{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '#abp-artist{font-size:11px;color:#a0a0b8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
   + '#abp-toggle{font-family:"JetBrains Mono",monospace;font-size:14px;color:#6a6a85;flex-shrink:0;line-height:1}'
   + '#abp-body{padding:0 13px 13px}'
   + '#abp-ctrls{display:flex;align-items:center;justify-content:space-between;gap:6px;margin-bottom:10px}'
   + '.abp-btn{background:#1c1c2a;border:1px solid #34344e;color:#f4f4f8;border-radius:9px;height:34px;'
   + 'cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;transition:.15s;padding:0}'
   + '.abp-btn:hover{border-color:#3affe0;color:#3affe0}.abp-btn:active{transform:translateY(1px)}'
   + '.abp-btn.wide{flex:1}.abp-btn.sq{width:38px}'
   + '#abp-play{background:linear-gradient(120deg,#3affe0,#7c5cff);color:#0a0a0f;border:none;font-weight:700}'
   + '.abp-btn.act{background:rgba(58,255,224,.14);border-color:#3affe0;color:#3affe0}'
   + '#abp-volrow{display:flex;align-items:center;gap:9px}'
   + '#abp-vol{flex:1;-webkit-appearance:none;height:4px;border-radius:3px;background:#34344e;outline:none}'
   + '#abp-vol::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#3affe0;cursor:pointer}'
   + '#abp-vol::-moz-range-thumb{width:14px;height:14px;border:none;border-radius:50%;background:#3affe0;cursor:pointer}'
   + '#abp-volicon{font-size:13px;color:#a0a0b8;width:16px;text-align:center}'
   + '#abp-count{font-family:"JetBrains Mono",monospace;font-size:10px;color:#6a6a85;text-align:center;margin-top:8px;letter-spacing:.04em}'
   + '@media(max-width:520px){#abplayer{width:calc(100vw - 28px);left:14px;bottom:14px}}';
  var style=document.createElement('style');style.textContent=css;document.head.appendChild(style);

  var box=document.createElement('div');
  box.id='abplayer';
  box.className='min'+(list.length?'':' empty');
  box.innerHTML=''
   + '<div id="abp-bar">'
   +   '<div id="abp-eq"><i></i><i></i><i></i></div>'
   +   '<div id="abp-now"><div id="abp-title">Background music</div><div id="abp-artist">tap to open</div></div>'
   +   '<div id="abp-toggle">▴</div>'
   + '</div>'
   + '<div id="abp-body">'
   +   '<div id="abp-ctrls">'
   +     '<button class="abp-btn sq" id="abp-prev" title="Previous">⏮</button>'
   +     '<button class="abp-btn sq" id="abp-stop" title="Stop">⏹</button>'
   +     '<button class="abp-btn wide" id="abp-play" title="Play / Pause" style="height:34px">▶ Play</button>'
   +     '<button class="abp-btn sq" id="abp-next" title="Next">⏭</button>'
   +     '<button class="abp-btn sq act" id="abp-shuf" title="Shuffle">🔀</button>'
   +   '</div>'
   +   '<div id="abp-volrow"><span id="abp-volicon">🔊</span><input id="abp-vol" type="range" min="0" max="1" step="0.01"></div>'
   +   '<div id="abp-count"></div>'
   + '</div>';
  document.body.appendChild(box);

  var elTitle=box.querySelector('#abp-title'),elArtist=box.querySelector('#abp-artist'),
      elToggle=box.querySelector('#abp-toggle'),elPlay=box.querySelector('#abp-play'),
      elShuf=box.querySelector('#abp-shuf'),elVol=box.querySelector('#abp-vol'),
      elCount=box.querySelector('#abp-count'),elBar=box.querySelector('#abp-bar');

  elVol.value=vol;
  elShuf.classList.toggle('act',shuffle);

  function curTrack(){ return list[order[pos]]; }
  function updateNow(){
    var t=curTrack();
    if(!t){elTitle.textContent='No tracks yet';elArtist.textContent='add files in playlists.js';return;}
    elTitle.textContent=t.title||'Untitled';
    elArtist.textContent=t.artist||'';
    elCount.textContent=(pos+1)+' / '+order.length+(shuffle?'  ·  shuffle on':'');
  }
  function load(play){
    var t=curTrack(); if(!t)return;
    audio.src=t.src; audio.load();
    updateNow();
    if(play) doPlay();
  }
  function doPlay(){
    if(!curTrack())return;
    if(!audio.src) load(false);
    audio.play().then(function(){
      playing=true;elPlay.innerHTML='⏸ Pause';box.classList.add('on');
    }).catch(function(){
      elArtist.textContent='⚠ file not found — check src in playlists.js';
    });
  }
  function doPause(){ audio.pause();playing=false;elPlay.innerHTML='▶ Play';box.classList.remove('on'); }
  function doStop(){ audio.pause();audio.currentTime=0;playing=false;elPlay.innerHTML='▶ Play';box.classList.remove('on'); }
  function next(auto){ if(!order.length)return; pos=(pos+1)%order.length; if(pos===0&&shuffle&&auto)shuffleOrder(false); load(true); }
  function prev(){ if(!order.length)return; if(audio.currentTime>3){audio.currentTime=0;return;} pos=(pos-1+order.length)%order.length; load(true); }

  // events
  elBar.addEventListener('click',function(){ box.classList.toggle('min'); elToggle.textContent=box.classList.contains('min')?'▴':'▾'; });
  elPlay.addEventListener('click',function(e){e.stopPropagation(); if(playing)doPause(); else doPlay();});
  box.querySelector('#abp-stop').addEventListener('click',function(e){e.stopPropagation();doStop();});
  box.querySelector('#abp-next').addEventListener('click',function(e){e.stopPropagation();next(false);});
  box.querySelector('#abp-prev').addEventListener('click',function(e){e.stopPropagation();prev();});
  elShuf.addEventListener('click',function(e){e.stopPropagation();
    shuffle=!shuffle; elShuf.classList.toggle('act',shuffle);
    localStorage.setItem('ab_player_shuffle',shuffle?'1':'0');
    if(shuffle)shuffleOrder(true); else { order=list.map(function(_,i){return i;}); pos=order.indexOf(order[pos])>=0?pos:0; }
    updateNow();
  });
  elVol.addEventListener('input',function(){ audio.volume=parseFloat(elVol.value); localStorage.setItem('ab_player_vol',elVol.value); });
  audio.addEventListener('ended',function(){ next(true); });
  audio.addEventListener('error',function(){ if(audio.src) elArtist.textContent='⚠ could not load this track'; });

  // init display (don’t autoplay; wait for user gesture)
  if(list.length){ updateNow(); elArtist.textContent=(curTrack().artist||'tap play to start'); }
})();
