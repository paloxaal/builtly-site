/* ===== Builtly Maps — live property-intelligence engine =====
   A cadastral scan feeds a central analysis core: data is pulled live from
   multiple registries (left), fused and analysed in the core (centre), and
   validated results — value, risk, compliance, energy — stream out (right),
   each confirmed with a check or flagged as risk. Self-contained canvas 2D,
   paused when the tab is hidden, single static frame under reduced-motion. */
(function(){
  var stages = document.querySelectorAll('.maps-stage');
  if(!stages.length) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var DPR = Math.min(window.devicePixelRatio||1, 2), TWO = Math.PI*2;

  // localized short labels for the canvas (registries in, results out)
  // Data sources — real public registries Builtly pulls from. Proper nouns, so
  // shown identically in every language. A curated subset only (we don't expose
  // the full source stack).
  var SRCN = ['Kartverket','Brønnøysund','NVE','SSB','NGU'];
  var OUTL = {
    en:['Value','Risk','Compliance','Energy'],
    no:['Verdi','Risiko','Regelverk','Energi'],
    sv:['Värde','Risk','Regelverk','Energi'],
    da:['Værdi','Risiko','Regelsæt','Energi'],
    fi:['Arvo','Riski','Säännöt','Energia'],
    de:['Wert','Risiko','Regelwerk','Energie']
  };
  function outl(){ return OUTL[(document.documentElement.lang||'en').slice(0,2)] || OUTL.en; }

  var ADDRS=['gnr 47 / bnr 12','gnr 12 / bnr 318','gnr 203 / bnr 7','gnr 61 / bnr 145','gnr 88 / bnr 24','gnr 7 / bnr 902','gnr 119 / bnr 40'];
  var TEAL='45,212,191', MINT='94,234,212', AMBER='251,191,36', PAPER='247,244,237';

  stages.forEach(function(stage){
    var canvas = stage.querySelector('.maps-stage-canvas');
    if(!canvas) return;
    var ctx = canvas.getContext('2d');
    var countEl = stage.querySelector('[data-ms-count]');
    var addrEl  = stage.querySelector('[data-ms-addr]');
    var W=0,H=0,FS=10,showLabels=true;

    var PARCELS=[
      {x:0.30,y:0.20,w:0.12,h:0.10,r:-0.10},
      {x:0.62,y:0.22,w:0.13,h:0.10,r:0.06},
      {x:0.44,y:0.40,w:0.12,h:0.11,r:-0.05},
      {x:0.70,y:0.46,w:0.12,h:0.10,r:0.05},
      {x:0.34,y:0.54,w:0.12,h:0.10,r:-0.06}
    ].map(function(p){p.hit=-1e9;p.idx=(Math.random()*ADDRS.length)|0;return p;});

    var core={x:0.52,y:0.33};
    var SRC=[0.17,0.25,0.33,0.41,0.49].map(function(fy,i){return{x:0.08,y:fy,i:i,emit:Math.random()*1400,last:-1e9};});
    var OUT=[0.18,0.29,0.40,0.50].map(function(fy,i){return{x:0.92,y:fy,i:i,flash:-1e9,risk:false,val:''};});

    var parts=[], scanned=128, shown=128, coreFlare=-1e9, t0=performance.now(), prevX=0, started=false;
    var PERIOD=5200;

    function resize(){
      var r=canvas.getBoundingClientRect();
      W=r.width;H=r.height;
      canvas.width=Math.max(1,Math.round(W*DPR));
      canvas.height=Math.max(1,Math.round(H*DPR));
      ctx.setTransform(DPR,0,0,DPR,0,0);
      FS=Math.max(8,Math.min(11,W*0.013));
      showLabels = W>440;
    }
    resize();
    if(window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
    else window.addEventListener('resize',resize);

    function qbez(a,c,b,t){ var u=1-t; return u*u*a+2*u*t*c+t*t*b; }
    function ingest(sx,sy){
      parts.push({k:1,ax:sx,ay:sy,bx:core.x,by:core.y,
        cx:(sx+core.x)/2+(Math.random()-0.5)*0.10, cy:(sy+core.y)/2+(Math.random()-0.5)*0.12,
        t:0,dur:900+Math.random()*600});
    }
    function output(){
      var o=OUT[(Math.random()*OUT.length)|0];
      parts.push({k:2,o:o,ax:core.x,ay:core.y,bx:o.x,by:o.y,
        cx:(core.x+o.x)/2,cy:(core.y+o.y)/2+(Math.random()-0.5)*0.06,
        t:0,dur:650+Math.random()*350});
    }
    function parcelPath(cx,cy,w,h,rot){
      var rad=Math.min(w,h)*0.18;
      ctx.save();ctx.translate(cx,cy);ctx.rotate(rot);
      var x=-w/2,y=-h/2;
      ctx.beginPath();ctx.moveTo(x+rad,y);
      ctx.arcTo(x+w,y,x+w,y+h,rad);ctx.arcTo(x+w,y+h,x,y+h,rad);
      ctx.arcTo(x,y+h,x,y,rad);ctx.arcTo(x,y,x+w,y,rad);ctx.closePath();ctx.restore();
    }

    function draw(now){
      var t=now-t0, beamX=((t%PERIOD)/PERIOD)*W, Lo=outl();
      ctx.clearRect(0,0,W,H);

      // graticule
      var gs=Math.max(30,W/16), drift=(t*0.004)%gs, x,y;
      ctx.lineWidth=1;ctx.strokeStyle='rgba('+PAPER+',0.04)';ctx.beginPath();
      for(x=-drift;x<=W;x+=gs){ctx.moveTo(x,0);ctx.lineTo(x,H);}
      for(y=-drift;y<=H;y+=gs){ctx.moveTo(0,y);ctx.lineTo(W,y);}
      ctx.stroke();

      var cxp=core.x*W, cyp=core.y*H;

      // connective circuitry
      ctx.lineWidth=1;ctx.strokeStyle='rgba('+TEAL+',0.06)';
      SRC.forEach(function(s){var sx=s.x*W,sy=s.y*H;ctx.beginPath();ctx.moveTo(sx,sy);
        ctx.quadraticCurveTo((sx+cxp)/2,(sy+cyp)/2-8,cxp,cyp);ctx.stroke();});
      OUT.forEach(function(o){ctx.beginPath();ctx.moveTo(cxp,cyp);ctx.lineTo(o.x*W,o.y*H);ctx.stroke();});

      // scan + parcels
      if(started&&!reduce){
        var wrapped=beamX<prevX;
        PARCELS.forEach(function(p){
          var cx=p.x*W, crossed=wrapped?(cx>prevX-1||cx<=beamX):(cx>prevX&&cx<=beamX);
          if(crossed&&now-p.hit>PERIOD*0.5){
            p.hit=now;p.idx=(p.idx+1)%ADDRS.length;
            if(addrEl) addrEl.textContent=ADDRS[p.idx];
            for(var b=0;b<3;b++) ingest(p.x,p.y);
          }
        });
      }
      PARCELS.forEach(function(p){
        var cx=p.x*W,cy=p.y*H,pw=p.w*W,ph=p.h*H,age=now-p.hit,k=age<1600?1-age/1600:0;
        parcelPath(cx,cy,pw,ph,p.r);
        ctx.fillStyle='rgba('+TEAL+','+(0.025+0.16*k).toFixed(3)+')';ctx.fill();
        ctx.lineWidth=1.1;ctx.strokeStyle='rgba('+TEAL+','+(0.14+0.5*k).toFixed(3)+')';ctx.stroke();
      });
      if(!reduce){
        var tw=Math.max(36,W*0.08), g=ctx.createLinearGradient(beamX-tw,0,beamX,0);
        g.addColorStop(0,'rgba('+TEAL+',0)');g.addColorStop(1,'rgba('+TEAL+',0.09)');
        ctx.fillStyle=g;ctx.fillRect(beamX-tw,0,tw,H);
        ctx.strokeStyle='rgba('+MINT+',0.42)';ctx.lineWidth=1.1;
        ctx.beginPath();ctx.moveTo(beamX,0);ctx.lineTo(beamX,H);ctx.stroke();
      }

      // source emission
      if(!reduce) SRC.forEach(function(s){ if(now>s.emit){s.emit=now+700+Math.random()*900;s.last=now;ingest(s.x,s.y);} });

      // particles
      for(var i=parts.length-1;i>=0;i--){
        var p=parts[i]; p.t+=16.7;
        var tt=p.t/p.dur; if(tt>1)tt=1;
        var px=qbez(p.ax,p.cx,p.bx,tt)*W, py=qbez(p.ay,p.cy,p.by,tt)*H;
        var col=p.k===1?TEAL:MINT;
        ctx.beginPath();ctx.arc(px,py,4.5,0,TWO);ctx.fillStyle='rgba('+col+',0.12)';ctx.fill();
        ctx.beginPath();ctx.arc(px,py,p.k===1?1.7:2.1,0,TWO);ctx.fillStyle='rgba('+col+',0.9)';ctx.fill();
        if(tt>=1){
          if(p.k===1){coreFlare=now;output();}
          else{p.o.flash=now;p.o.risk=(p.o.i===1)&&(Math.random()<0.4);scanned+=1;}
          parts.splice(i,1);
        }
      }

      // core
      var fAge=now-coreFlare, fk=fAge<520?1-fAge/520:0, cr=Math.min(W,H)*(0.07+0.018*Math.sin(now*0.004));
      if(fk>0){ctx.beginPath();ctx.arc(cxp,cyp,cr+(1-fk)*Math.min(W,H)*0.10,0,TWO);
        ctx.strokeStyle='rgba('+MINT+','+(0.5*fk).toFixed(3)+')';ctx.lineWidth=1.6;ctx.stroke();}
      ctx.save();ctx.translate(cxp,cyp);ctx.rotate(now*0.0006);
      ctx.strokeStyle='rgba('+TEAL+',0.5)';ctx.lineWidth=1.4;ctx.setLineDash([4,6]);
      ctx.beginPath();ctx.arc(0,0,cr,0,TWO);ctx.stroke();ctx.setLineDash([]);ctx.restore();
      ctx.save();ctx.translate(cxp,cyp);ctx.rotate(-now*0.0004);
      for(var a=0;a<24;a++){var an=a/24*TWO,r1=cr*0.6,r2=cr*0.74;
        ctx.strokeStyle='rgba('+MINT+','+(a%6===0?0.6:0.22)+')';ctx.lineWidth=1;
        ctx.beginPath();ctx.moveTo(Math.cos(an)*r1,Math.sin(an)*r1);ctx.lineTo(Math.cos(an)*r2,Math.sin(an)*r2);ctx.stroke();}
      ctx.restore();
      ctx.beginPath();ctx.arc(cxp,cyp,cr*0.4*(1+0.12*fk),0,TWO);
      ctx.fillStyle='rgba('+TEAL+','+(0.16+0.5*fk).toFixed(3)+')';ctx.fill();
      ctx.beginPath();ctx.arc(cxp,cyp,3,0,TWO);ctx.fillStyle='rgba('+MINT+',0.95)';ctx.fill();

      // labels
      ctx.font='600 '+FS+'px "JetBrains Mono", ui-monospace, monospace';
      ctx.textBaseline='middle';
      SRC.forEach(function(s,idx){
        var sx=s.x*W,sy=s.y*H, em=Math.max(0,1-(now-s.last)/500);
        ctx.beginPath();ctx.arc(sx,sy,6,0,TWO);ctx.strokeStyle='rgba('+TEAL+',0.3)';ctx.lineWidth=1;ctx.stroke();
        ctx.beginPath();ctx.arc(sx,sy,3+1.5*em,0,TWO);ctx.fillStyle='rgba('+TEAL+','+(0.5+0.5*em).toFixed(3)+')';ctx.fill();
        if(showLabels){ctx.textAlign='left';ctx.fillStyle='rgba('+PAPER+',0.55)';ctx.fillText(SRCN[idx]||'',sx+10,sy);}
      });
      OUT.forEach(function(o,idx){
        var ox=o.x*W,oy=o.y*H, fa=now-o.flash, fkk=fa<900?1-fa/900:0, rgb=o.risk?AMBER:MINT;
        ctx.beginPath();ctx.arc(ox,oy,3+2*fkk,0,TWO);ctx.fillStyle='rgba('+rgb+','+(0.4+0.6*fkk).toFixed(3)+')';ctx.fill();
        if(showLabels){
          ctx.textAlign='right';ctx.fillStyle='rgba('+PAPER+','+(0.4+0.4*fkk).toFixed(3)+')';ctx.fillText(Lo[idx]||'',ox-10,oy);
          if(fkk>0){ctx.textAlign='left';ctx.fillStyle='rgba('+rgb+','+(0.1+0.9*fkk).toFixed(3)+')';ctx.fillText(o.risk?'⚠':'✓',ox+8,oy);}
        }
      });

      shown += (scanned-shown)*0.08;
      if(countEl) countEl.textContent=Math.round(shown).toLocaleString();
      prevX=beamX; started=true;
    }

    if(reduce){
      PARCELS[0].hit=performance.now(); OUT[0].flash=performance.now(); OUT[2].flash=performance.now();
      ingest(SRC[1].x,SRC[1].y); ingest(SRC[3].x,SRC[3].y);
      draw(performance.now()); return;
    }
    (function loop(now){ if(!document.hidden) draw(now); requestAnimationFrame(loop); })(performance.now());
  });
})();
