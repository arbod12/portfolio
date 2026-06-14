/* ============================================================
   Ariel Bodik — accessibility widget
   ------------------------------------------------------------
   A floating button (bottom-right) that opens a panel of real,
   working accessibility adjustments. Self-contained, no third
   party services, no tracking. Choices persist across pages
   via localStorage.

   Toggles: Bigger text, High contrast, Reduce motion,
   Readable font, Highlight links, Big cursor, Reading guide.
   Plus a Reset button.

   Drop into every page with <script src="a11y.js"></script>
   (use ../a11y.js on tool pages).
   ============================================================ */
(function(){
  if(window.__a11yLoaded) return; window.__a11yLoaded = true;

  var KEY = 'ab_a11y';
  var state = {};
  try{ state = JSON.parse(localStorage.getItem(KEY) || '{}'); }catch(e){ state = {}; }

  // options: id, label, description
  var OPTIONS = [
    {id:'bigText',  label:'Bigger text',     desc:'Increase font size across the page'},
    {id:'contrast', label:'High contrast',   desc:'Boost contrast for readability'},
    {id:'reduce',   label:'Reduce motion',   desc:'Stop the snow and animations'},
    {id:'readable', label:'Readable font',   desc:'Switch to a plain, easy-to-read font'},
    {id:'links',    label:'Highlight links', desc:'Underline and mark every link'},
    {id:'cursor',   label:'Big cursor',      desc:'Enlarge the mouse pointer'},
    {id:'guide',    label:'Reading guide',   desc:'A bar that follows your mouse'}
  ];

  /* ---- styles (scoped with a11y- prefixes) ---- */
  var css = ''
   + '#a11y-btn{position:fixed;right:18px;bottom:18px;z-index:10000;width:52px;height:52px;border-radius:50%;'
   + 'background:#ff2d77;border:2px solid #1a1a1a;box-shadow:3px 3px 0 #1a1a1a;cursor:pointer;display:flex;'
   + 'align-items:center;justify-content:center;transition:transform .15s;padding:0}'
   + '#a11y-btn:hover{transform:translate(1px,1px);box-shadow:2px 2px 0 #1a1a1a}'
   + '#a11y-btn svg{width:28px;height:28px;fill:#fff}'
   + '#a11y-panel{position:fixed;right:18px;bottom:80px;z-index:10000;width:320px;max-width:calc(100vw - 28px);'
   + 'background:#fff;border:2px solid #1a1a1a;box-shadow:6px 6px 0 rgba(26,26,26,.9);'
   + 'font-family:"JetBrains Mono","Courier New",monospace;color:#15130f;display:none;max-height:78vh;overflow:auto}'
   + '#a11y-panel.open{display:block}'
   + '#a11y-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;border-bottom:2px solid #1a1a1a;background:#ff2d77;color:#fff}'
   + '#a11y-head b{font-size:15px;font-family:"Clash Display","JetBrains Mono",sans-serif}'
   + '#a11y-close{background:#fff;border:2px solid #1a1a1a;color:#1a1a1a;width:26px;height:26px;cursor:pointer;font-size:15px;line-height:1;padding:0}'
   + '#a11y-list{padding:6px 14px 14px}'
   + '.a11y-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 2px;border-bottom:1px solid #e2ddd2}'
   + '.a11y-row:last-child{border-bottom:none}'
   + '.a11y-lab{font-size:13px;font-weight:600}'
   + '.a11y-lab small{display:block;color:#7a756a;font-weight:400;font-size:11px;margin-top:3px;line-height:1.4}'
   + '.a11y-tog{width:46px;height:26px;border:2px solid #1a1a1a;background:#fff;position:relative;cursor:pointer;flex-shrink:0;transition:.15s}'
   + '.a11y-tog::after{content:"";position:absolute;top:2px;left:2px;width:18px;height:18px;background:#1a1a1a;transition:.15s}'
   + '.a11y-tog.on{background:#ff2d77}'
   + '.a11y-tog.on::after{left:22px;background:#fff}'
   + '#a11y-reset{width:calc(100% - 28px);margin:4px 14px 16px;padding:10px;font-family:inherit;font-weight:700;'
   + 'background:#fff;border:2px solid #1a1a1a;box-shadow:2px 2px 0 #1a1a1a;cursor:pointer}'
   + '#a11y-reset:hover{background:#f4f1ea}'
   + '#a11y-credit{padding:0 16px 14px;font-size:10px;color:#7a756a;text-align:center}'
   // ---- effect styles applied to <html> ----
   + 'html.a11y-bigText{font-size:118% !important}'
   + 'html.a11y-readable, html.a11y-readable *{font-family:Arial,Helvetica,system-ui,sans-serif !important;letter-spacing:normal !important}'
   + 'html.a11y-contrast{filter:contrast(1.32) !important;background:#fff}'
   + 'html.a11y-links a{text-decoration:underline !important;text-underline-offset:2px;outline:2px solid #ffd23a;outline-offset:1px}'
   + 'html.a11y-cursor, html.a11y-cursor *{cursor:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'40\' height=\'40\' viewBox=\'0 0 40 40\'%3E%3Cpath d=\'M6 2 L6 32 L14 24 L20 36 L26 33 L20 22 L31 22 Z\' fill=\'white\' stroke=\'black\' stroke-width=\'2\'/%3E%3C/svg%3E") 4 2, auto !important}'
   + 'html.a11y-reduce #snow-canvas{display:none !important}'
   + '#a11y-guide{position:fixed;left:0;right:0;height:38px;background:rgba(255,210,58,.22);border-top:2px solid #ffd23a;border-bottom:2px solid #ffd23a;pointer-events:none;z-index:9998;display:none}'
   + 'html.a11y-guide #a11y-guide{display:block}'
   + '@media(max-width:520px){#a11y-panel{bottom:78px}}';
  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ---- build button + panel ---- */
  var btn = document.createElement('button');
  btn.id = 'a11y-btn';
  btn.setAttribute('aria-label','Accessibility options');
  btn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="3.5" r="2"/><path d="M21 7c-2.5 1-5.5 1.5-9 1.5S5.5 8 3 7l-.5 2c2 .8 4.3 1.3 6.5 1.5l-1 9 2 .2.9-6.7h.2l.9 6.7 2-.2-1-9c2.2-.2 4.5-.7 6.5-1.5L21 7z"/></svg>';

  var panel = document.createElement('div');
  panel.id = 'a11y-panel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-label','Accessibility adjustments');
  var rows = OPTIONS.map(function(o){
    return '<div class="a11y-row"><div class="a11y-lab">'+o.label+'<small>'+o.desc+'</small></div>'
         + '<div class="a11y-tog" data-id="'+o.id+'" role="switch" tabindex="0" aria-label="'+o.label+'"></div></div>';
  }).join('');
  panel.innerHTML = '<div id="a11y-head"><b>Accessibility</b><button id="a11y-close" aria-label="Close">\u2715</button></div>'
    + '<div id="a11y-list">'+rows+'</div>'
    + '<button id="a11y-reset">Reset all</button>'
    + '<div id="a11y-credit">Built-in accessibility \u00b7 saved on this device</div>';

  function ready(){
    document.body.appendChild(btn);
    document.body.appendChild(panel);
    var guide = document.createElement('div'); guide.id='a11y-guide'; document.body.appendChild(guide);
    apply();
    wire(guide);
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();

  function apply(){
    OPTIONS.forEach(function(o){
      var on = !!state[o.id];
      document.documentElement.classList.toggle('a11y-'+o.id, on);
      var tog = panel.querySelector('.a11y-tog[data-id="'+o.id+'"]');
      if(tog) tog.classList.toggle('on', on);
    });
  }
  function save(){ try{ localStorage.setItem(KEY, JSON.stringify(state)); }catch(e){} }

  function wire(guide){
    btn.addEventListener('click', function(){ panel.classList.toggle('open'); });
    panel.querySelector('#a11y-close').addEventListener('click', function(){ panel.classList.remove('open'); });

    panel.querySelectorAll('.a11y-tog').forEach(function(tog){
      function toggle(){
        var id = tog.getAttribute('data-id');
        state[id] = !state[id];
        save(); apply();
      }
      tog.addEventListener('click', toggle);
      tog.addEventListener('keydown', function(e){ if(e.key===' '||e.key==='Enter'){ e.preventDefault(); toggle(); } });
    });

    panel.querySelector('#a11y-reset').addEventListener('click', function(){
      state = {}; save(); apply();
    });

    // reading guide follows the mouse
    document.addEventListener('mousemove', function(e){
      if(state.guide) guide.style.top = (e.clientY - 19) + 'px';
    });

    // close panel on Escape
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') panel.classList.remove('open'); });
  }
})();
