/* ============================================================
   Ariel Bodik — falling snow background
   ------------------------------------------------------------
   Continuous gentle snowfall behind all page content, similar
   to welcometocore.com. Self-contained, no dependencies.

   It sits at z-index 0 with pointer-events:none, so it never
   blocks clicks and stays behind your UI. Respects the OS
   "reduce motion" setting (skips animation if the user asked
   for less motion).

   To tune: change FLAKES (count) or SPEED below.
   ============================================================ */
(function(){
  if(window.__snowLoaded) return; window.__snowLoaded = true;

  // skip for users who prefer reduced motion
  try{
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  }catch(e){}

  var FLAKES = 70;     // how many snowflakes on screen
  var SPEED  = 1;      // overall fall-speed multiplier

  var canvas = document.createElement('canvas');
  canvas.id = 'snow-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  // insert as the first child of body so it sits behind everything
  function attach(){
    document.body.insertBefore(canvas, document.body.firstChild);
    init();
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }

  var ctx, W, H, flakes = [];

  function rand(min, max){ return Math.random()*(max-min)+min; }

  function makeFlake(){
    return {
      x: rand(0, W),
      y: rand(-H, 0),
      r: rand(1, 3.6),              // radius
      d: rand(0.4, 1.2),            // drift factor
      vy: rand(0.4, 1.3)*SPEED,     // vertical speed
      sway: rand(0, Math.PI*2),     // horizontal sway phase
      swaySpeed: rand(0.005, 0.02),
      o: rand(0.35, 0.85)           // opacity
    };
  }

  function size(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function init(){
    ctx = canvas.getContext('2d');
    size();
    flakes = [];
    for(var i=0;i<FLAKES;i++) flakes.push(makeFlake());
    window.addEventListener('resize', size);
    requestAnimationFrame(loop);
  }

  function loop(){
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<flakes.length;i++){
      var f = flakes[i];
      f.y += f.vy;
      f.sway += f.swaySpeed;
      f.x += Math.sin(f.sway)*f.d;

      // recycle flakes that fall off the bottom or drift off-screen
      if(f.y > H + 6){ f.y = -6; f.x = rand(0, W); }
      if(f.x > W + 6) f.x = -6;
      if(f.x < -6)   f.x = W + 6;

      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,'+f.o+')';
      ctx.fill();
    }
    requestAnimationFrame(loop);
  }
})();
