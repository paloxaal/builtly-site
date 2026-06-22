/* ===== Builtly Maps — live property-scan animation =====
   A top-down "satellite scan" of a stylised cadastral map: a sweep beam
   crosses building footprints, lighting each parcel and dropping a data
   pin as it is "found". A small node graph in the corner pulses to signal
   the connection to the engineering modules. Self-contained, paused when
   the tab is hidden, reduced to a single static frame under reduced-motion. */
(function(){
  var stages = document.querySelectorAll('.maps-stage');
  if(!stages.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var dpr = Math.min(window.devicePixelRatio || 1, 2);
  var ADDRS = ['gnr 47 / bnr 12','gnr 12 / bnr 318','gnr 203 / bnr 7','gnr 61 / bnr 145','gnr 88 / bnr 24','gnr 7 / bnr 902','gnr 119 / bnr 40'];
  stages.forEach(function(stage){
    var canvas = stage.querySelector('.maps-stage-canvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var countEl = stage.querySelector('[data-ms-count]');
    var addrEl  = stage.querySelector('[data-ms-addr]');
    var W = 0, H = 0, TWO = Math.PI*2;
    var PARCELS = [
      {x:0.20,y:0.30,w:0.15,h:0.12,r:-0.10},
      {x:0.43,y:0.22,w:0.12,h:0.15,r: 0.06},
      {x:0.66,y:0.28,w:0.17,h:0.12,r:-0.05},
      {x:0.84,y:0.46,w:0.13,h:0.13,r: 0.10},
      {x:0.30,y:0.56,w:0.16,h:0.13,r: 0.04},
      {x:0.54,y:0.63,w:0.14,h:0.14,r:-0.07},
      {x:0.74,y:0.73,w:0.15,h:0.12,r: 0.05},
      {x:0.16,y:0.76,w:0.13,h:0.12,r:-0.06}
    ].map(function(p){ p.hit = -1e9; p.idx = Math.floor(Math.random()*ADDRS.length); return p; });
    var ROADS = [
      [[0,0.46],[0.34,0.43],[0.52,0.50],[1,0.47]],
      [[0.48,0],[0.50,0.46],[0.47,1]],
      [[0,0.84],[1,0.80]]
    ];
    var MODC = {x:0.88,y:0.15}, MODN = 5;
    var scanned = 128, shown = 128;
    function resize(){
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width  = Math.max(1, Math.round(W*dpr));
      canvas.height = Math.max(1, Math.round(H*dpr));
      ctx.setTransform(dpr,0,0,dpr,0,0);
    }
    resize();
    if(window.ResizeObserver){ new ResizeObserver(resize).observe(canvas); }
    else { window.addEventListener('resize', resize); }
    function parcelPath(cx,cy,w,h,rot){
      var rad = Math.min(w,h)*0.18;
      ctx.save(); ctx.translate(cx,cy); ctx.rotate(rot);
      var x=-w/2, y=-h/2;
      ctx.beginPath();
      ctx.moveTo(x+rad,y);
      ctx.arcTo(x+w,y,x+w,y+h,rad);
      ctx.arcTo(x+w,y+h,x,y+h,rad);
      ctx.arcTo(x,y+h,x,y,rad);
      ctx.arcTo(x,y,x+w,y,rad);
      ctx.closePath();
      ctx.restore();
    }
    var PERIOD = 4400, t0 = performance.now(), prevX = 0, started = false;
    PARCELS[2].hit = t0 - 900;
    function draw(now){
      var t = now - t0;
      var beamX = ((t % PERIOD)/PERIOD) * W;
      ctx.clearRect(0,0,W,H);
      var gs = Math.max(30, W/15), drift = (t*0.004) % gs, x, y;
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(247,244,237,0.045)';
      ctx.beginPath();
      for(x=-drift; x<=W; x+=gs){ ctx.moveTo(x,0); ctx.lineTo(x,H); }
      for(y=-drift; y<=H; y+=gs){ ctx.moveTo(0,y); ctx.lineTo(W,y); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(247,244,237,0.085)'; ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ROADS.forEach(function(rd){
        ctx.beginPath();
        rd.forEach(function(p,i){ var X=p[0]*W, Y=p[1]*H; if(i) ctx.lineTo(X,Y); else ctx.moveTo(X,Y); });
        ctx.stroke();
      });
      if(started && !reduce){
        var wrapped = beamX < prevX;
        PARCELS.forEach(function(p){
          var cx = p.x*W;
          var crossed = wrapped ? (cx > prevX-1 || cx <= beamX) : (cx > prevX && cx <= beamX);
          if(crossed && (now - p.hit) > PERIOD*0.5){
            p.hit = now; p.idx = (p.idx+1) % ADDRS.length;
            scanned += 1 + Math.floor(Math.random()*2);
            if(addrEl) addrEl.textContent = ADDRS[p.idx];
          }
        });
      }
      var active = null, actAge = 1e9;
      PARCELS.forEach(function(p){
        var cx=p.x*W, cy=p.y*H, pw=p.w*W, ph=p.h*H;
        var age = now-p.hit, k = age<1700 ? 1-age/1700 : 0;
        parcelPath(cx,cy,pw,ph,p.r);
        ctx.fillStyle = 'rgba(45,212,191,'+(0.03+0.22*k).toFixed(3)+')'; ctx.fill();
        ctx.lineWidth = 1.2; ctx.strokeStyle = 'rgba(45,212,191,'+(0.20+0.55*k).toFixed(3)+')'; ctx.stroke();
        if(k>0 && age<actAge){ active=p; actAge=age; }
        ctx.beginPath(); ctx.arc(cx,cy,1.6,0,TWO);
        ctx.fillStyle = 'rgba(94,234,212,'+(0.35+0.5*k).toFixed(3)+')'; ctx.fill();
      });
      if(active){
        var ax=active.x*W, ay=active.y*H, aage=now-active.hit, ak=Math.max(0,1-aage/1700);
        var rr=(1-ak)*Math.min(W,H)*0.16;
        ctx.beginPath(); ctx.arc(ax,ay,rr,0,TWO);
        ctx.strokeStyle='rgba(45,212,191,'+(0.4*ak).toFixed(3)+')'; ctx.lineWidth=1.4; ctx.stroke();
        var rsz=8+4*Math.sin(now*0.006);
        ctx.strokeStyle='rgba(94,234,212,'+(0.2+0.5*ak).toFixed(3)+')'; ctx.lineWidth=1.2;
        ctx.beginPath();
        ctx.moveTo(ax-rsz,ay); ctx.lineTo(ax-rsz*0.4,ay);
        ctx.moveTo(ax+rsz*0.4,ay); ctx.lineTo(ax+rsz,ay);
        ctx.moveTo(ax,ay-rsz); ctx.lineTo(ax,ay-rsz*0.4);
        ctx.moveTo(ax,ay+rsz*0.4); ctx.lineTo(ax,ay+rsz);
        ctx.stroke();
        var rise=Math.min(1, aage/300), py=ay-18*rise-10;
        ctx.globalAlpha=ak;
        ctx.beginPath(); ctx.moveTo(ax,ay-4); ctx.lineTo(ax-5,py); ctx.lineTo(ax+5,py); ctx.closePath();
        ctx.fillStyle='#2DD4BF'; ctx.fill();
        ctx.beginPath(); ctx.arc(ax,py-3,5,0,TWO); ctx.fillStyle='#2DD4BF'; ctx.fill();
        ctx.beginPath(); ctx.arc(ax,py-3,2.2,0,TWO); ctx.fillStyle='#0E1218'; ctx.fill();
        ctx.globalAlpha=1;
      }
      if(!reduce){
        var tw=Math.max(40, W*0.10);
        var g=ctx.createLinearGradient(beamX-tw,0,beamX,0);
        g.addColorStop(0,'rgba(45,212,191,0)');
        g.addColorStop(1,'rgba(45,212,191,0.16)');
        ctx.fillStyle=g; ctx.fillRect(beamX-tw,0,tw,H);
        ctx.strokeStyle='rgba(94,234,212,0.7)'; ctx.lineWidth=1.4;
        ctx.beginPath(); ctx.moveTo(beamX,0); ctx.lineTo(beamX,H); ctx.stroke();
        var hy=(t*0.25)%H;
        ctx.beginPath(); ctx.arc(beamX,hy,2.4,0,TWO); ctx.fillStyle='rgba(204,255,247,0.9)'; ctx.fill();
      }
      var mx=MODC.x*W, my=MODC.y*H, act=Math.floor(now/700)%MODN, i;
      for(i=0;i<MODN;i++){
        var ang=-1.05 + i*(2.1/(MODN-1)), len=Math.min(W,H)*0.085;
        var ex=mx+Math.cos(ang)*len, ey=my+Math.sin(ang)*len, on=(i===act)?1:0.35;
        ctx.strokeStyle='rgba(45,212,191,'+(0.07+0.18*on).toFixed(3)+')'; ctx.lineWidth=1.1;
        ctx.beginPath(); ctx.moveTo(mx,my); ctx.lineTo(ex,ey); ctx.stroke();
        ctx.beginPath(); ctx.arc(ex,ey,1.8,0,TWO);
        ctx.fillStyle='rgba(94,234,212,'+(0.2+0.5*on).toFixed(3)+')'; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(mx,my,3.2,0,TWO); ctx.fillStyle='#2DD4BF'; ctx.fill();
      shown += (scanned-shown)*0.08;
      if(countEl) countEl.textContent = Math.round(shown).toLocaleString();
      prevX = beamX; started = true;
    }
    if(reduce){ PARCELS[2].hit = performance.now(); draw(performance.now()); return; }
    (function loop(now){ if(!document.hidden) draw(now); requestAnimationFrame(loop); })(performance.now());
  });
})();
