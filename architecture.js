class ArchitectureWorld {
constructor(host){
this.host=host;host.innerHTML='<canvas class="architecture-canvas" tabindex="0" aria-label="Archive architecture. Drag to pan, scroll to zoom, arrow keys to move, plus and minus to zoom."></canvas><div class="world-controls"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div>';
const c=this.c=host.querySelector('canvas'),g=this.g=c.getContext('2d');this.W=1;this.H=1;this.x=768;this.y=512;this.z=1;this.selected=[];this.im=new Image();this.im.onload=()=>{this.ready=true;this.focus(this.selected)};this.im.onerror=()=>{document.querySelector('#art-status').textContent='Artwork could not load. Please reload.'};this.im.src=window.jennyImageParts.join('');
new ResizeObserver(()=>{this.W=host.clientWidth;this.H=host.clientHeight;c.width=this.W*devicePixelRatio;c.height=this.H*devicePixelRatio;this.draw()}).observe(host);
const pts=new Map();let prev=null;const pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};const gesture=()=>{let a=[...pts.values()];return a.length>1?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:a.length?{...a[0],d:0}:null};c.onpointerdown=e=>{cancelAnimationFrame(this.frame);c.setPointerCapture(e.pointerId);pts.set(e.pointerId,pos(e));prev=gesture()};c.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,pos(e));let a=gesture();this.x-=(a.x-prev.x)/this.z;this.y-=(a.y-prev.y)/this.z;if(a.d&&prev.d)this.zoom(a.d/prev.d,a.x,a.y);else this.draw();prev=a};c.onpointerup=c.onpointercancel=e=>{pts.delete(e.pointerId);prev=gesture()};c.addEventListener('wheel',e=>{e.preventDefault();let p=pos(e);this.zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});host.querySelectorAll('.world-controls button').forEach((b,i)=>b.onclick=()=>this.zoom(i?1/1.3:1.3));c.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();cancelAnimationFrame(this.frame);if(e.key==='+'||e.key==='=')this.zoom(1.2);else if(e.key==='-')this.zoom(1/1.2);else{this.x+=({ArrowLeft:-80,ArrowRight:80}[e.key]||0)/this.z;this.y+=({ArrowUp:-80,ArrowDown:80}[e.key]||0)/this.z;this.draw()}}};
}
zoom(f,px=this.W/2,py=this.H/2){cancelAnimationFrame(this.frame);let nz=Math.max(.08,Math.min(4,this.z*f));this.x+=(px-this.W/2)*(1/this.z-1/nz);this.y+=(py-this.H/2)*(1/this.z-1/nz);this.z=nz;this.draw()}
focus(ids){this.selected=ids.filter(id=>ArchitectureWorld.boxes[id]);const boxes=this.selected.map(id=>ArchitectureWorld.boxes[id]);let x=768,y=512,z=Math.min(this.W/1580,this.H/1070);if(boxes.length){let l=Math.min(...boxes.map(b=>b[0])),t=Math.min(...boxes.map(b=>b[1])),r=Math.max(...boxes.map(b=>b[0]+b[2])),b=Math.max(...boxes.map(b=>b[1]+b[3]));x=(l+r)/2;y=(t+b)/2;z=Math.min(this.W/(r-l+160),this.H/(b-t+160),1.8)}cancelAnimationFrame(this.frame);let from=[this.x,this.y,this.z],start=performance.now();const run=now=>{let t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/520),e=1-(1-t)**3;[this.x,this.y,this.z]=from.map((v,i)=>v+([x,y,z][i]-v)*e);this.draw();if(t<1)this.frame=requestAnimationFrame(run)};this.frame=requestAnimationFrame(run)}
draw(){if(!this.ready)return;const g=this.g,z=this.z,W=this.W,H=this.H;g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);g.clearRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z,z);g.translate(-this.x,-this.y);g.fillStyle='#fff';g.fillRect(0,0,1536,1024);
g.globalAlpha=this.selected.length?.2:1;g.drawImage(this.im,0,0,1536,1024);g.globalAlpha=1;
if(this.selected.length){
g.save();g.beginPath();
for(const id of this.selected){const q=ArchitectureWorld.boxes[id],poly=ArchitectureWorld.regions[id]||[[q[0],q[1]],[q[0]+q[2],q[1]],[q[0]+q[2],q[1]+q[3]],[q[0],q[1]+q[3]]];poly.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath()}
if(['P02','P05','P14'].every(id=>this.selected.includes(id))){g.rect(550,365,150,80);g.rect(675,620,80,135)}
g.clip();g.drawImage(this.im,0,0,1536,1024);g.restore();
}
g.restore();
}
}
ArchitectureWorld.boxes={P01:[20,20,430,450],P02:[445,65,275,330],P03:[25,460,500,145],P04:[1040,550,240,250],P05:[520,310,480,350],P06:[795,25,300,305],P08:[300,615,325,255],P09:[425,750,260,250],P10:[1120,20,405,420],P11:[940,265,340,285],P12:[15,590,330,415],P13:[1250,470,275,415],P14:[685,675,485,340]};

ArchitectureWorld.regions={
P14:[[680,650],[770,650],[820,680],[1035,680],[1035,775],[1110,775],[1110,845],[1170,845],[1170,950],[1050,1020],[680,1020]],
P01:[[20,20],[365,20],[445,235],[455,460],[20,470]],
P02:[[440,65],[720,65],[720,375],[640,395],[480,385],[440,240]],
P05:[[520,430],[720,375],[780,375],[780,300],[890,300],[900,475],[935,480],[935,550],[995,595],[995,660],[630,660],[630,570],[520,550]],
P06:[[795,25],[1100,25],[1100,260],[1040,260],[1040,330],[795,330]],
P11:[[1060,265],[1180,265],[1280,355],[1280,550],[940,550],[940,370]]
};
