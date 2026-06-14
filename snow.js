/* ============================================================
   Ariel Bodik — pixelated 8-bit colorful snow (smooth fall)
   ------------------------------------------------------------
   Chunky retro-game snowflakes that drift down smoothly in a
   playful colorful palette. Each flake is drawn as crisp pixel
   blocks (8-bit look) but moves with smooth sub-pixel physics
   so the fall glides instead of stepping. Sits behind all
   content, never blocks clicks, respects "reduce motion".

   Tune at the top: FLAKES (count), SPEED (fall speed),
   PIXEL (block size), COLORS (palette).
   ============================================================ */
(function(){
  if(window.__snowLoaded) return; window.__snowLoaded = true;
  try{
    if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  }catch(e){}

  var FLAKES = 60;     // how many flakes on screen
  var SPEED  = 0.75;   // overall fall-speed multiplier (lower = gentler)
  var PIXEL  = 4;      // size of one "pixel" block (bigger = chunkier)

  var COLORS = ['#ff5c8a','#3affe0','#7c5cff','#ffd23a','#5cff7a','#5cc8ff','#ff8f3a','#ff5cf0'];

  var SHAPES = [
    [[0,1,0],[1,1,1],[0,1,0]],   // plus / diamond
    [[1,1],[1,1]],               // 2x2 block
    [[1]],                       // single chunky dot
    [[1,0,1],[0,1,0],[1,0,1]]    // sparkle
  ];

  var canvas = document.createElement('canvas');
  canvas.id = 'snow-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0;';

  function attach(){ document.body.insertBefore(canvas, document.body.firstChild); init(); }
  if(document.readyState === 'loading'){ document.addEventListener('DOMContentLoaded', attach); }
  else { attach(); }

  var ctx, W, H, flakes = [];
  function rand(a,b){ return Math.random()*(b-a)+a; }
  function pick(arr){ return arr[(Math.random()*arr.length)|0]; }

  function makeFlake(){
    return {
      x: rand(0, W),
      y: rand(-H, 0),
      vy: rand(0.35, 0.9)*SPEED,   // gentler vertical speed range
      sway: rand(0, Math.PI*2),
      swaySpeed: rand(0.008, 0.018),
      drift: rand(0.2, 0.7),       // softer horizontal sway
      color: pick(COLORS),
      shape: pick(SHAPES),
      scale: (Math.random()<0.3?2:1)
    };
  }

  function size(){
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    if(ctx) ctx.imageSmoothingEnabled = false;
  }

  function init(){
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    size();
    flakes = [];
    for(var i=0;i<FLAKES;i++) flakes.push(makeFlake());
    window.addEventListener('resize', size);
    requestAnimationFrame(loop);
  }

  function drawFlake(f){
    var p = PIXEL*f.scale;
    var shape = f.shape;
    // snap only the draw origin to the pixel grid so blocks stay crisp,
    // while the flake's real position moves smoothly underneath
    var ox = Math.round(f.x/PIXEL)*PIXEL;
    var oy = Math.round(f.y/PIXEL)*PIXEL;
    ctx.fillStyle = f.color;
    for(var r=0;r<shape.length;r++){
      for(var c=0;c<shape[r].length;c++){
        if(shape[r][c]) ctx.fillRect(ox + c*p, oy + r*p, p, p);
      }
    }
  }

  function loop(){
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<flakes.length;i++){
      var f = flakes[i];
      f.y += f.vy;                  // smooth sub-pixel descent
      f.sway += f.swaySpeed;
      f.x += Math.sin(f.sway)*f.drift;

      if(f.y > H + 20){ f.y = -20; f.x = rand(0,W); f.color = pick(COLORS); f.shape = pick(SHAPES); }
      if(f.x > W + 20) f.x = -20;
      if(f.x < -20)   f.x = W + 20;

      drawFlake(f);
    }
    requestAnimationFrame(loop);
  }
})();
