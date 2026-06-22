/* ===== Builtly Maps — live property-intelligence engine =====
   A cadastral scan runs AI detection over building footprints (focus
   brackets + confidence), extracts each into a central analysis core fed
   live from public registries, and emits validated results — value, risk,
   compliance, energy — each rendered as its own live gauge and confirmed
   with a check or flagged as risk. Self-contained canvas 2D, paused when
   the tab is hidden, single static frame under reduced-motion. */
(function(){
  var stages = document.querySelectorAll('.maps-stage');
  if(!stages.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio||1, 2), TWO = Math.PI*2;

  // Data sources — real public registries (curated subset; proper nouns shown
  // identically in every language). Each gets its own packet hue.
  var SRCN = ['Kartverket','Brønnøysund','NVE','SSB','NGU'];
  var SRCH = ['45,212,191','94,234,212','56,189,248','125,211,252','20,184,166'];
  // Analysis outputs — localized result types.
  var OUTL = {
    en:['Value','Risk','Compliance','Energy'], no:['Verdi','Risiko','Regelverk','Energi'],
    sv:['Värde','Risk','Regelverk','Energi'],  da:['Værdi','Risiko','Regelsæt','Energi'],
    fi:['Arvo','Riski','Säännöt','Energia'],    de:['Wert','Risiko','Regelwerk','Energie']
  };
  function outl(){ return OUTL[(document.documentElement.lang||'en').slice(0,2)] || OUTL.en; }
  var ADDRS=['gnr 47 / bnr 12','gnr 12 / bnr 318','gnr 203 / bnr 7','gnr 61 / bnr 145','gnr 88 / bnr 24','gnr 7 / bnr 902','gnr 119 / bnr 40'];
  var TEAL='45,212,191', MINT='94,234,212', AMBER='251,191,36', PAPER='247,244,237';

  stages.forEach(function(stage){
    var canvas = stage.querySelector('.maps-stage-canvas'); if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var countEl = stage.querySelector('[data-ms-count]'), addrEl = stage.querySelector('[data-ms-addr]');
    var W=0,H=0,FS=10,GW=30,showLabels=true;

    var PARCELS=[
      {x:0.30,y:0.20,w:0.12,h:0.10,r:-0.10},
      {x:0.62,y:0.22,w:0.13,h:0.10,r: 0.06},
      {x:0.44,y:0.40,w:0.12,h:0.11,r:-0.05},
      {x:0.70,y:0.46,w:0.12,h:0.10,r: 0.05},
      {x:0.34,y:0.55,w:0.12,h:0.10,r:-0.06}
    ].map(function(p){p.hit=-1e9;p.idx=(Math.random()*ADDRS.length)|0;p.conf=0.9;return p;});

    var core={x:0.52,y:0.33};
    var SRC=[0.17,0.25,0.33,0.41,0.49].map(function(fy,i){return{x:0.08,y:fy,i:i,emit:Math.random()*1400,last:-1e9};});
    var OUT=[0.18,0.29,0.40,0.50].map(function(fy,i){return{x:0.92,y:fy,i:i,flash:-1e9,risk:false,v:0.45,tv:0.6};});

    var parts=[], beams=[], scanned=128, shown=128, coreFlare=-1e9, t0=performance.now(), prevX=0, started=false;
    var PERIOD=5200, DETECT=2000;

    function resize(){
      var r=canvas.getBoundingClientRect();
      W=r.width;H=r.height;
      canvas.width=Math.max(1,Math.round(W*DPR));
      canvas.height=Math.max(1,Math.round(H*DPR));
      ctx.setTransform(DPR,0,0,DPR,0,0);
      FS=Math.max(8,Math.min(11,W*0.013));
      GW=Math.max(24,Math.min(40,W*0.05));
      showLabels = W>460;
    }
    resize();
    if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize',resize);

    function qbez(a,c,b,t){var u=1-t;return u*u*a+2*u*t*c+t*t*b;}
    function ingest(sx,sy,hue){
      parts.push({k:1,hue:hue||TEAL,ax:sx,ay:sy,bx:core.x,by:core.y,
        cx:(sx+core.x)/2+(Math.random()-0.5)*0.10, cy:(sy+core.y)/2+(Math.random()-0.5)*0.12,
        t:0,dur:900+Math.random()*600,px:sx*1,py:sy*1});
    }
    function output(){
      var o=OUT[(Math.random()*OUT.length)|0];
      parts.push({k:2,o:o,hue:MINT,ax:core.x,ay:core.y,bx:o.x,by:o.y,
        cx:(core.x+o.x)/2,cy:(core.y+o.y)/2+(Math.random()-0.5)*0.06,
        t:0,dur:650+Math.random()*350,px:core.x,py:core.y});
    }
    function parcelPath(cx,cy,w,h,rot){
      var rad=Math.min(w,h)*0.18; ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
      var x=-w/2,y=-h/2; ctx.beginPath();ctx.moveTo(x+rad,y);
      ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);
      ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();ctx.restore();
    }

    function drawDetect(p,now){
      var age=now-p.hit; if(age>DETECT) return;
      var k=1-age/DETECT, ap=Math.min(1,age/220);
      var cx=p.x*W,cy=p.y*H, pw=p.w*W*1.3, ph=p.h*H*1.45;
      var x0=cx-pw/2,y0=cy-ph/2,x1=cx+pw/2,y1=cy+ph/2, L=Math.min(pw,ph)*0.30*ap;
      ctx.strokeStyle='rgba('+MINT+','+(0.9*k).toFixed(3)+')'; ctx.lineWidth=1.5; ctx.beginPath();
      ctx.moveTo(x0,y0+L);ctx.lineTo(x0,y0);ctx.lineTo(x0+L,y0);
      ctx.moveTo(x1-L,y0);ctx.lineTo(x1,y0);ctx.lineTo(x1,y0+L);
      ctx.moveTo(x1,y1-L);ctx.lineTo(x1,y1);ctx.lineTo(x1-L,y1);
      ctx.moveTo(x0+L,y1);ctx.lineTo(x0,y1);ctx.lineTo(x0,y1-L);ctx.stroke();
      // sweep line inside box
      var sy=y0+((age*0.18)% ph);
      ctx.strokeStyle='rgba('+MINT+','+(0.35*k).toFixed(3)+')';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x0,sy);ctx.lineTo(x1,sy);ctx.stroke();
      if(showLabels){
        ctx.font='600 '+(FS-1)+'px "JetBrains Mono", ui-monospace, monospace';
        ctx.textAlign='left';ctx.textBaseline='alphabetic';
        ctx.fillStyle='rgba('+MINT+','+(0.9*k).toFixed(3)+')';
        ctx.fillText(p.conf.toFixed(2), x0, y0-5);
      }
    }

    function gauge(o,now){
      var ox=o.x*W, oy=o.y*H, fa=now-o.flash, fk=fa<900?1-fa/900:0;
      o.v += (o.tv-o.v)*0.08;
      ctx.font='600 '+FS+'px "JetBrains Mono", ui-monospace, monospace'; ctx.textBaseline='middle';
      // node + flash ring
      var rgb=o.risk?AMBER:MINT;
      if(fk>0){ctx.beginPath();ctx.arc(ox,oy,4+8*(1-fk),0,TWO);ctx.strokeStyle='rgba('+rgb+','+(0.5*fk).toFixed(3)+')';ctx.lineWidth=1.2;ctx.stroke();}
      ctx.beginPath();ctx.arc(ox,oy,3+2*fk,0,TWO);ctx.fillStyle='rgba('+rgb+','+(0.45+0.55*fk).toFixed(3)+')';ctx.fill();
      if(!showLabels) return;
      ctx.textAlign='right';ctx.fillStyle='rgba('+PAPER+','+(0.42+0.4*fk).toFixed(3)+')';
      ctx.fillText(outl()[o.i]||'', ox-9, oy);
      var lw=ctx.measureText(outl()[o.i]||'').width;
      var gx=ox-9-lw-10; // right edge of gauge
      ctx.save();
      if(o.i===0){ // value bar
        var w=GW,h=5,x=gx-w,y=oy-h/2;
        ctx.strokeStyle='rgba('+PAPER+',0.20)';ctx.lineWidth=1;ctx.strokeRect(x,y,w,h);
        ctx.fillStyle='rgba('+MINT+',0.8)';ctx.fillRect(x+1,y+1,(w-2)*o.v,h-2);
      } else if(o.i===1){ // risk needle (top semicircle)
        var r=GW*0.5, cxx=gx-r, cyy=oy+r*0.4;
        ctx.strokeStyle='rgba('+PAPER+',0.20)';ctx.lineWidth=1.4;
        ctx.beginPath();ctx.arc(cxx,cyy,r,Math.PI,TWO);ctx.stroke();
        var an=Math.PI+o.v*Math.PI;
        ctx.strokeStyle='rgba('+(o.risk?AMBER:MINT)+',0.95)';ctx.lineWidth=1.6;
        ctx.beginPath();ctx.moveTo(cxx,cyy);ctx.lineTo(cxx+Math.cos(an)*r*0.9,cyy+Math.sin(an)*r*0.9);ctx.stroke();
      } else if(o.i===2){ // compliance ticks
        var n=3, sq=5, gap=4, on=Math.round(o.v*n), tot=n*sq+(n-1)*gap, sx=gx-tot;
        for(var i=0;i<n;i++){var bx=sx+i*(sq+gap);
          if(i<on){ctx.fillStyle='rgba('+MINT+',0.85)';ctx.fillRect(bx,oy-sq/2,sq,sq);}
          else{ctx.strokeStyle='rgba('+PAPER+',0.22)';ctx.lineWidth=1;ctx.strokeRect(bx,oy-sq/2,sq,sq);}}
      } else { // energy scale
        var seg=6, sw=Math.max(3,GW/seg-1.5), mark=Math.round(o.v*(seg-1)), tot2=seg*(sw+1.5), sx2=gx-tot2;
        for(var j=0;j<seg;j++){var bx2=sx2+j*(sw+1.5);
          ctx.fillStyle=(j===mark)?'rgba('+MINT+',0.95)':'rgba('+PAPER+',0.16)';
          ctx.fillRect(bx2,oy-3,sw,6);}
      }
      ctx.restore();
    }

    function drawCore(now){
      var cxp=core.x*W, cyp=core.y*H, R=Math.min(W,H)*(0.085+0.015*Math.sin(now*0.004));
      var fAge=now-coreFlare, fk=fAge<520?1-fAge/520:0;
      if(fk>0){ctx.beginPath();ctx.arc(cxp,cyp,R+(1-fk)*Math.min(W,H)*0.11,0,TWO);
        ctx.strokeStyle='rgba('+MINT+','+(0.5*fk).toFixed(3)+')';ctx.lineWidth=1.6;ctx.stroke();}
      // throughput gauge arc
      var prog=(now%2400)/2400;
      ctx.strokeStyle='rgba('+MINT+',0.55)';ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.arc(cxp,cyp,R*1.18,-Math.PI/2,-Math.PI/2+prog*TWO);ctx.stroke();ctx.lineCap='butt';
      // segmented outer ring
      ctx.save();ctx.translate(cxp,cyp);ctx.rotate(now*0.0005);
      for(var s=0;s<3;s++){var a0=s*TWO/3+0.25, a1=(s+1)*TWO/3-0.25;
        ctx.strokeStyle='rgba('+TEAL+',0.4)';ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(0,0,R*1.36,a0,a1);ctx.stroke();}
      ctx.restore();
      // tick ring
      ctx.save();ctx.translate(cxp,cyp);ctx.rotate(-now*0.0004);
      for(var a=0;a<24;a++){var an=a/24*TWO,r1=R*0.62,r2=R*0.76;
        ctx.strokeStyle='rgba('+MINT+','+(a%6===0?0.6:0.22)+')';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(Math.cos(an)*r1,Math.sin(an)*r1);ctx.lineTo(Math.cos(an)*r2,Math.sin(an)*r2);ctx.stroke();}
      ctx.restore();
      // inner processing cluster (6 nodes)
      var rot=now*0.0011, act=(now/260|0)%6;
      for(var n=0;n<6;n++){var an2=rot+n*TWO/6, nx=cxp+Math.cos(an2)*R*0.4, ny=cyp+Math.sin(an2)*R*0.4, on=(n===act)?1:0.3;
        ctx.strokeStyle='rgba('+MINT+','+(0.1+0.25*on).toFixed(3)+')';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(cxp,cyp);ctx.lineTo(nx,ny);ctx.stroke();
        ctx.beginPath();ctx.arc(nx,ny,1.6+1.4*on,0,TWO);ctx.fillStyle='rgba('+MINT+','+(0.4+0.5*on).toFixed(3)+')';ctx.fill();}
      // hub
      ctx.beginPath();ctx.arc(cxp,cyp,R*0.28*(1+0.14*fk),0,TWO);ctx.fillStyle='rgba('+TEAL+','+(0.2+0.5*fk).toFixed(3)+')';ctx.fill();
      ctx.beginPath();ctx.arc(cxp,cyp,3,0,TWO);ctx.fillStyle='rgba('+MINT+',0.95)';ctx.fill();
    }

    function draw(now){
      var t=now-t0, beamX=((t%PERIOD)/PERIOD)*W, cxp=core.x*W, cyp=core.y*H;
      ctx.clearRect(0,0,W,H);

      // graticule
      var gs=Math.max(30,W/16), drift=(t*0.004)%gs, x,y;
      ctx.lineWidth=1;ctx.strokeStyle='rgba('+PAPER+',0.04)';ctx.beginPath();
      for(x=-drift;x<=W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H);}
      for(y=-drift;y<=H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y);}
      ctx.stroke();

      // circuitry
      ctx.lineWidth=1;
      SRC.forEach(function(s){var sx=s.x*W,sy=s.y*H;ctx.strokeStyle='rgba('+SRCH[s.i]+',0.07)';
        ctx.beginPath();ctx.moveTo(sx,sy);ctx.quadraticCurveTo((sx+cxp)/2,(sy+cyp)/2-8,cxp,cyp);ctx.stroke();});
      OUT.forEach(function(o){ctx.strokeStyle='rgba('+TEAL+',0.06)';ctx.beginPath();ctx.moveTo(cxp,cyp);ctx.lineTo(o.x*W,o.y*H);ctx.stroke();});

      // scan + detection
      if(started&&!reduce){
        var wrapped=beamX<prevX;
        PARCELS.forEach(function(p){
          var cx=p.x*W, crossed=wrapped?(cx>prevX-1||cx<=beamX):(cx>prevX&&cx<=beamX);
          if(crossed&&now-p.hit>PERIOD*0.5){
            p.hit=now;p.idx=(p.idx+1)%ADDRS.length;p.conf=0.88+Math.random()*0.11;
            if(addrEl) addrEl.textContent=ADDRS[p.idx];
            beams.push({x:p.x,y:p.y,t:now});
            for(var b=0;b<4;b++) ingest(p.x,p.y, SRCH[(Math.random()*SRCH.length)|0]);
          }
        });
      }
      PARCELS.forEach(function(p){
        var cx=p.x*W,cy=p.y*H,pw=p.w*W,ph=p.h*H,age=now-p.hit,k=age<1600?1-age/1600:0;
        parcelPath(cx,cy,pw,ph,p.r);
        ctx.fillStyle='rgba('+TEAL+','+(0.02+0.14*k).toFixed(3)+')';ctx.fill();
        ctx.lineWidth=1.1;ctx.strokeStyle='rgba('+TEAL+','+(0.13+0.45*k).toFixed(3)+')';ctx.stroke();
        drawDetect(p,now);
      });
      if(!reduce){
        var tw=Math.max(36,W*0.08), g=ctx.createLinearGradient(beamX-tw,0,beamX,0);
        g.addColorStop(0,'rgba('+TEAL+',0)');g.addColorStop(1,'rgba('+TEAL+',0.08)');
        ctx.fillStyle=g;ctx.fillRect(beamX-tw,0,tw,H);
        ctx.strokeStyle='rgba('+MINT+',0.38)';ctx.lineWidth=1.1;
        ctx.beginPath();ctx.moveTo(beamX,0);ctx.lineTo(beamX,H);ctx.stroke();
      }

      // extraction beams (parcel -> core)
      for(var bi=beams.length-1;bi>=0;bi--){
        var bm=beams[bi], ba=now-bm.t, bk=ba<450?1-ba/450:0;
        if(bk<=0){beams.splice(bi,1);continue;}
        ctx.strokeStyle='rgba('+MINT+','+(0.6*bk).toFixed(3)+')';ctx.lineWidth=1+1.5*bk;
        ctx.beginPath();ctx.moveTo(bm.x*W,bm.y*H);ctx.lineTo(cxp,cyp);ctx.stroke();
      }

      // source emission
      if(!reduce) SRC.forEach(function(s){ if(now>s.emit){s.emit=now+700+Math.random()*900;s.last=now;ingest(s.x,s.y,SRCH[s.i]);} });

      // particles (with trails)
      for(var i=parts.length-1;i>=0;i--){
        var p=parts[i]; p.t+=16.7; var tt=p.t/p.dur; if(tt>1)tt=1;
        var px=qbez(p.ax,p.cx,p.bx,tt)*W, py=qbez(p.ay,p.cy,p.by,tt)*H;
        ctx.strokeStyle='rgba('+p.hue+',0.5)';ctx.lineWidth=p.k===1?1.4:1.7;
        ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(px,py);ctx.stroke();
        ctx.beginPath();ctx.arc(px,py,p.k===1?1.7:2.1,0,TWO);ctx.fillStyle='rgba('+p.hue+',0.95)';ctx.fill();
        p.px=px;p.py=py;
        if(tt>=1){
          if(p.k===1){coreFlare=now;output();}
          else{p.o.flash=now;p.o.tv=p.o.i===1?(Math.random()<0.4?0.62+Math.random()*0.3:0.15+Math.random()*0.3):0.45+Math.random()*0.5;
            p.o.risk=(p.o.i===1)&&(p.o.tv>0.6);scanned+=1;}
          parts.splice(i,1);
        }
      }

      drawCore(now);

      // sources
      ctx.font='600 '+FS+'px "JetBrains Mono", ui-monospace, monospace';ctx.textBaseline='middle';
      SRC.forEach(function(s,idx){
        var sx=s.x*W,sy=s.y*H, em=Math.max(0,1-(now-s.last)/500);
        ctx.beginPath();ctx.arc(sx,sy,6,0,TWO);ctx.strokeStyle='rgba('+SRCH[idx]+',0.35)';ctx.lineWidth=1;ctx.stroke();
        ctx.beginPath();ctx.arc(sx,sy,3+1.6*em,0,TWO);ctx.fillStyle='rgba('+SRCH[idx]+','+(0.5+0.5*em).toFixed(3)+')';ctx.fill();
        if(showLabels){ctx.textAlign='left';ctx.fillStyle='rgba('+PAPER+',0.55)';ctx.fillText(SRCN[idx]||'',sx+10,sy);}
      });

      // outputs (gauges)
      OUT.forEach(function(o){ gauge(o,now); });

      shown += (scanned-shown)*0.08;
      if(countEl) countEl.textContent=Math.round(shown).toLocaleString();
      prevX=beamX; started=true;
    }

    if(reduce){
      PARCELS[0].hit=performance.now();PARCELS[2].hit=performance.now();
      PARCELS[0].conf=0.94;PARCELS[2].conf=0.91;
      OUT[0].flash=performance.now();OUT[0].v=0.8;OUT[2].flash=performance.now();OUT[2].v=1;
      OUT[1].v=0.3;OUT[3].v=0.5;
      ingest(SRC[1].x,SRC[1].y,SRCH[1]);ingest(SRC[3].x,SRC[3].y,SRCH[3]);
      draw(performance.now());return;
    }
    (function loop(now){ if(!document.hidden) draw(now); requestAnimationFrame(loop); })(performance.now());
  });
})();
