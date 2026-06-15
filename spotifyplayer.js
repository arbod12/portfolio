/* ============================================================
   Ariel Bodik — floating Spotify mood player
   ------------------------------------------------------------
   A small player pinned to the bottom-left of every page. Click
   to expand into a real Spotify embed; pick a mood to swap the
   playlist. Works for everyone, no login (full tracks for signed-in
   Spotify users, previews otherwise).

   Note: because each page is a real page load, audio restarts when
   you navigate. The player remembers your mood and open/closed state
   so it reopens the same vibe on the next page.

   Drop into every page:  <script src="spotifyplayer.js"></script>
   (root pages) or <script src="../spotifyplayer.js"></script> (tools).

   To change a mood, edit MOOD_PLAYLISTS below and paste a different
   playlist ID from a link like:
   https://open.spotify.com/playlist/XXXXXXXXXXXXXXXXXXXXXX
   ============================================================ */
(function(){
  if(window.__abSpotifyLoaded) return; window.__abSpotifyLoaded = true;

  var MOOD_PLAYLISTS = {
    calm:    '081dqljJl2aBxMEvivUZ3Y',
    focused: '2YHJ9HYj50h5eEmSKAySCw',
    upbeat:  '1HVP7E8RkpieiGSxvATJbU'
  };

  var LS_MOOD = 'ab_spotify_mood';
  var LS_OPEN = 'ab_spotify_open';

  var mood = 'calm', open = false;
  try { mood = localStorage.getItem(LS_MOOD) || 'calm'; } catch(e){}
  try { open = localStorage.getItem(LS_OPEN) === '1'; } catch(e){}

  /* ---- styles (Core theme: hard borders, pink accent, mono) ---- */
  var css = ''
  + '#absp{position:fixed;left:18px;bottom:18px;z-index:9999;font-family:"JetBrains Mono","Courier New",monospace}'
  // collapsed pill
  + '#absp-pill{display:flex;align-items:center;gap:9px;background:#1db954;color:#04140a;'
  + 'border:2px solid #1a1a1a;box-shadow:3px 3px 0 #1a1a1a;cursor:pointer;padding:9px 13px;font-weight:700;'
  + 'font-size:12px;letter-spacing:.04em;text-transform:uppercase}'
  + '#absp-pill:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 #1a1a1a}'
  + '#absp-pill .ic{font-size:14px;line-height:1}'
  // expanded panel
  + '#absp-panel{display:none;width:320px;max-width:calc(100vw - 36px);background:#fff;'
  + 'border:2px solid #1a1a1a;box-shadow:5px 5px 0 rgba(26,26,26,.9)}'
  + '#absp.open #absp-panel{display:block}'
  + '#absp.open #absp-pill{display:none}'
  + '#absp-top{display:flex;align-items:center;gap:8px;padding:9px 12px;border-bottom:2px solid #1a1a1a;background:#1db954;color:#04140a}'
  + '#absp-top b{font-size:12px;letter-spacing:.1em;text-transform:uppercase;font-weight:700}'
  + '#absp-min{margin-left:auto;background:#fff;border:2px solid #1a1a1a;color:#1a1a1a;width:24px;height:24px;cursor:pointer;font-size:14px;line-height:1;padding:0}'
  + '#absp-moods{display:flex;gap:6px;padding:11px 12px 0}'
  + '#absp-moods button{flex:1;background:#fff;border:2px solid #1a1a1a;color:#15130f;cursor:pointer;'
  + 'font-family:inherit;font-size:10px;letter-spacing:.03em;text-transform:uppercase;font-weight:700;'
  + 'padding:7px 3px;box-shadow:2px 2px 0 rgba(26,26,26,.3)}'
  + '#absp-moods button:hover{border-color:#1db954}'
  + '#absp-moods button.on{background:#1db954;color:#04140a;border-color:#1a1a1a}'
  + '#absp-embed{padding:11px 12px 13px}'
  + '#absp-embed iframe{display:block;width:100%;border:0;border-radius:10px}'
  + '@media(max-width:520px){#absp-panel{width:280px}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ---- build ---- */
  var box = document.createElement('div'); box.id = 'absp';
  box.innerHTML =
      '<button id="absp-pill" aria-label="Open music player"><span class="ic">&#9835;</span> Music</button>'
    + '<div id="absp-panel" role="region" aria-label="Music player">'
    +   '<div id="absp-top"><b id="absp-tag">Music</b><button id="absp-min" aria-label="Minimize">_</button></div>'
    +   '<div id="absp-moods">'
    +     '<button data-mood="calm">Calm</button>'
    +     '<button data-mood="focused">Focused</button>'
    +     '<button data-mood="upbeat">Upbeat</button>'
    +   '</div>'
    +   '<div id="absp-embed"></div>'
    + '</div>';

  function ready(){
    document.body.appendChild(box);

    function renderEmbed(){
      var id = MOOD_PLAYLISTS[mood];
      var src = 'https://open.spotify.com/embed/playlist/' + id + '?utm_source=generator&theme=0';
      document.getElementById('absp-embed').innerHTML =
        '<iframe src="' + src + '" height="352" ' +
        'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" ' +
        'loading="lazy"></iframe>';
      document.getElementById('absp-tag').textContent = mood.charAt(0).toUpperCase()+mood.slice(1);
      box.querySelectorAll('#absp-moods button').forEach(function(b){
        b.classList.toggle('on', b.dataset.mood === mood);
      });
    }

    function setOpen(v){
      open = v;
      box.classList.toggle('open', v);
      try { localStorage.setItem(LS_OPEN, v ? '1' : '0'); } catch(e){}
      if(v) renderEmbed();
    }

    document.getElementById('absp-pill').addEventListener('click', function(){ setOpen(true); });
    document.getElementById('absp-min').addEventListener('click', function(){ setOpen(false); });

    box.querySelectorAll('#absp-moods button').forEach(function(btn){
      btn.addEventListener('click', function(){
        mood = btn.dataset.mood;
        try { localStorage.setItem(LS_MOOD, mood); } catch(e){}
        renderEmbed();
      });
    });

    // restore state from last page
    if(open){ box.classList.add('open'); renderEmbed(); }
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
