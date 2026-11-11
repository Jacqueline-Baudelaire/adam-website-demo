// Fixed seeded world: original artwork is never redrawn or recoloured.
class ArchitectureWorld {
constructor(host){
this.host=host;host.innerHTML='<canvas class="architecture-canvas" tabindex="0" aria-label="Infinite architecture. Drag to pan, scroll to zoom, arrow keys to move."></canvas><div class="world-controls"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div>';
const c=this.c=host.querySelector('canvas');this.g=c.getContext('2d');
this.W=host.clientWidth;this.H=host.clientHeight;this.x=750;this.y=575;this.z=1;this.selected=[];this.units=new Map();this.links=new Map();
this.assets=window.buildingAssets.map((a,i)=>({...a,color:['#B783BD','#B783BD','#B783BD','#B783BD','#B783BD','#B783BD','#EF3B64','#76758B','#76758B','#DDACAA','#DDACAA','#F1AB3D','#F1AB3D'][i],im:new Image()}));
Promise.all(this.assets.map(a=>new Promise((resolve,reject)=>{a.im.onload=()=>{const q=document.createElement('canvas');q.width=128;q.height=128;const g=q.getContext('2d');g.drawImage(a.im,0,0,128,128);a.alpha=g.getImageData(0,0,128,128).data;resolve()};a.im.onerror=reject;a.im.src=a.src}))).then(()=>{this.ready=true;this.focus(this.selected)}).catch(()=>document.querySelector('#art-status').textContent='Artwork could not load. Please reload.');
new ResizeObserver(()=>{this.W=host.clientWidth;this.H=host.clientHeight;c.width=this.W*devicePixelRatio;c.height=this.H*devicePixelRatio;this.draw()}).observe(host);
const pts=new Map();let prev=null;const pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};const gesture=()=>{let a=[...pts.values()];return a.length>1?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:a.length?{...a[0],d:0}:null};c.onpointerdown=e=>{cancelAnimationFrame(this.frame);c.setPointerCapture(e.pointerId);pts.set(e.pointerId,pos(e));prev=gesture()};c.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,pos(e));let a=gesture();this.x-=(a.x-prev.x)/this.z;this.y-=(a.y-prev.y)/this.z;if(a.d&&prev.d)this.zoom(a.d/prev.d,a.x,a.y);else this.draw();prev=a};c.onpointerup=c.onpointercancel=e=>{pts.delete(e.pointerId);prev=gesture()};c.addEventListener('wheel',e=>{e.preventDefault();let p=pos(e);this.zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});host.querySelectorAll('.world-controls button').forEach((b,i)=>b.onclick=()=>this.zoom(i?1/1.3:1.3));c.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();cancelAnimationFrame(this.frame);if(e.key==='+'||e.key==='=')this.zoom(1.2);else if(e.key==='-')this.zoom(1/1.2);else{this.x+=({ArrowLeft:-80,ArrowRight:80}[e.key]||0)/this.z;this.y+=({ArrowUp:-80,ArrowDown:80}[e.key]||0)/this.z;this.draw()}}};
}
zoom(f,px=this.W/2,py=this.H/2){cancelAnimationFrame(this.frame);let nz=Math.max(.22,Math.min(4,this.z*f));this.x+=(px-this.W/2)*(1/this.z-1/nz);this.y+=(py-this.H/2)*(1/this.z-1/nz);this.z=nz;this.draw()}
hash(x,y,s=0){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+20261111,144269);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296}

unit(i,j){
const key=i+','+j;if(this.units.has(key))return this.units.get(key);
let order=Array.from({length:13},(_,k)=>k);for(let k=12;k>0;k--){let m=Math.floor(this.hash(i,j,k+70)*(k+1));[order[k],order[m]]=[order[m],order[k]]}
const nodes=order.map((k,n)=>{const a=this.assets[k],angle=n*2.39996+this.hash(i,j,93)*6.28,radius=Math.sqrt(n)*138,size=k===2?450:350;return {...a,key:key+':'+a.id,x:Math.cos(angle)*radius,y:Math.sin(angle)*radius*.75,w:size*a.w/Math.max(a.w,a.h),h:size*a.h/Math.max(a.w,a.h)}});
// Pack all thirteen into one compact, irregular rectangular unit.
const placed=[],gap=16,binWidth=1750;
for(const n of nodes){
let best=null,score=Infinity;
const xs=[0,...placed.map(a=>a.x+a.w+gap)],ys=[0,...placed.map(a=>a.y+a.h+gap)];
for(const y of ys)for(const x of xs){
if(x+n.w>binWidth)continue;
if(placed.some(a=>x<a.x+a.w+gap&&x+n.w+gap>a.x&&y<a.y+a.h+gap&&y+n.h+gap>a.y))continue;
let value=y+x*.12;
if(value<score){score=value;best={x,y}}
}
n.x=best.x;n.y=best.y;placed.push(n)
}
for(const n of nodes){n.x+=n.w/2;n.y+=n.h/2}
const l=Math.min(...nodes.map(n=>n.x-n.w/2)),r=Math.max(...nodes.map(n=>n.x+n.w/2)),t=Math.min(...nodes.map(n=>n.y-n.h/2)),b=Math.max(...nodes.map(n=>n.y+n.h/2)),scale=Math.min(1400/(r-l),1050/(b-t),1.3);
for(const n of nodes){n.x=i*1500+750+(n.x-(l+r)/2)*scale;n.y=j*1150+575+(n.y-(t+b)/2)*scale;n.w*=scale;n.h*=scale}
const candidates=[];for(let a=0;a<13;a++)for(let b=a+1;b<13;b++){const n=nodes[a],m=nodes[b],p=this.port(n,m),q=this.port(m,n);candidates.push({a,b,p,q,d:Math.hypot(p.x-q.x,p.y-q.y)})}
candidates.sort((a,b)=>a.d-b.d);
let parent=nodes.map((_,i)=>i),edges=[];const root=n=>parent[n]===n?n:(parent[n]=root(parent[n]));
for(const e of candidates){let a=root(e.a),b=root(e.b);if(a!==b){parent[a]=b;edges.push([nodes[e.a],nodes[e.b]])}}
// Two short secondary links make the unit a mesh rather than a chain.
let extra=0;for(const e of candidates){const a=nodes[e.a],b=nodes[e.b];if(e.d>180||edges.some(([u,v])=>u===a&&v===b||u===b&&v===a))continue;edges.push([a,b]);if(++extra===2)break}
const unit={i,j,nodes,edges};this.units.set(key,unit);return unit
}
between(a,b){
const key=a.i+','+a.j+'>'+b.i+','+b.j;if(this.links.has(key))return this.links.get(key);
let best=null,d=Infinity;for(const n of a.nodes)for(const m of b.nodes){let v=Math.hypot(n.x-m.x,n.y-m.y)-(n.w+m.w+n.h+m.h)*.18;if(v<d){d=v;best=[n,m]}}
this.links.set(key,best);return best
}
nearest(id){
let best=null,d=Infinity,ci=Math.floor(this.x/1500),cj=Math.floor(this.y/1150);
for(let j=cj-1;j<=cj+1;j++)for(let i=ci-1;i<=ci+1;i++){let n=this.unit(i,j).nodes.find(n=>n.id===id),v=(n.x-this.x)**2+(n.y-this.y)**2;if(v<d){best=n;d=v}}return best
}
focus(ids){
this.selected=ids.filter(id=>this.assets.some(a=>a.id===id));
let x=750,y=575,z=Math.sqrt(this.W*this.H/(1500*1150*5.5/13));
if(this.selected.length){let ns=this.selected.map(id=>this.nearest(id)),l=Math.min(...ns.map(n=>n.x-n.w/2)),r=Math.max(...ns.map(n=>n.x+n.w/2)),t=Math.min(...ns.map(n=>n.y-n.h/2)),b=Math.max(...ns.map(n=>n.y+n.h/2));x=(l+r)/2;y=(t+b)/2;z=Math.min(this.W/(r-l+230),this.H/(b-t+230),1.65)}
cancelAnimationFrame(this.frame);let from=[this.x,this.y,this.z],start=performance.now();const run=now=>{let t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/520),e=1-(1-t)**3;[this.x,this.y,this.z]=from.map((v,i)=>v+([x,y,z][i]-v)*e);this.draw();if(t<1)this.frame=requestAnimationFrame(run)};this.frame=requestAnimationFrame(run)
}
port(n,other){
const dx=other.x-n.x,dy=other.y-n.y;let best=null,score=-Infinity;
for(let y=1;y<127;y+=2)for(let x=1;x<127;x+=2){if(n.alpha[(y*128+x)*4+3]<220)continue;
const px=(x/128-.5)*n.w,py=(y/128-.5)*n.h;
const along=(px*dx+py*dy)/Math.hypot(dx,dy),cross=Math.abs(px*dy-py*dx)/Math.hypot(dx,dy);
const v=along-cross*.65;if(v>score){score=v;best={x:n.x+px,y:n.y+py}}}
return best||{x:n.x,y:n.y}
}
bridge(a,b){
a.ports??={};b.ports??={};const p=a.ports[b.key]??=this.port(a,b),q=b.ports[a.key]??=this.port(b,a),g=this.g,dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,w=12;
const shape=off=>{g.beginPath();g.moveTo(p.x+nx*w,p.y+ny*w+off);g.bezierCurveTo(p.x+dx*.32+nx*7,p.y+dy*.32+ny*7+off,p.x+dx*.68+nx*7,p.y+dy*.68+ny*7+off,q.x+nx*w,q.y+ny*w+off);g.lineTo(q.x-nx*w,q.y-ny*w+off);g.bezierCurveTo(p.x+dx*.68-nx*7,p.y+dy*.68-ny*7+off,p.x+dx*.32-nx*7,p.y+dy*.32-ny*7+off,p.x-nx*w,p.y-ny*w+off);g.closePath()};
g.strokeStyle='#243047';g.lineWidth=1.4;g.lineJoin='round';shape(5);g.fillStyle='#388887';g.fill();g.stroke();shape(0);const grad=g.createLinearGradient(p.x,p.y,q.x,q.y);grad.addColorStop(0,a.color);grad.addColorStop(1,b.color);g.fillStyle=grad;g.fill();g.stroke()
}
draw(){
if(!this.ready)return;
const g=this.g,z=this.z,W=this.W,H=this.H;g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);g.clearRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z,z);g.translate(-this.x,-this.y);
const l=Math.floor((this.x-W/2/z)/1500)-1,r=Math.floor((this.x+W/2/z)/1500)+1,t=Math.floor((this.y-H/2/z)/1150)-1,b=Math.floor((this.y+H/2/z)/1150)+1;
const visible=[];for(let j=t;j<=b;j++)for(let i=l;i<=r;i++)visible.push(this.unit(i,j));
for(const u of visible){for(const [a,b] of u.edges)this.bridge(a,b);this.bridge(...this.between(u,this.unit(u.i+1,u.j)));this.bridge(...this.between(u,this.unit(u.i,u.j+1)))}
for(const u of visible)for(const n of u.nodes){g.drawImage(n.im,n.x-n.w/2,n.y-n.h/2,n.w,n.h);if(this.selected.includes(n.id)){g.strokeStyle='#984734';g.lineWidth=1.5/z;g.setLineDash([6/z,5/z]);g.strokeRect(n.x-n.w/2-8,n.y-n.h/2-8,n.w+16,n.h+16);g.setLineDash([])}}
g.restore();
if(this.units.size>180){this.units.clear();this.links.clear()}
}
}
