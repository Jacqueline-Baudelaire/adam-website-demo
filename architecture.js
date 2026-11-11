// Fixed seeded world: original artwork is never redrawn or recoloured.
class ArchitectureWorld {
constructor(host){
this.host=host;host.innerHTML='<canvas class="architecture-canvas" tabindex="0" aria-label="Infinite architecture. Drag to pan, scroll to zoom, arrow keys to move."></canvas><div class="world-controls"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div>';
const c=this.c=host.querySelector('canvas');this.g=c.getContext('2d');
this.W=host.clientWidth;this.H=host.clientHeight;this.x=0;this.y=0;this.z=1;this.selected=[];this.cache=new Map();this.rows=new Map();this.graphs=new Map();
this.assets=window.buildingAssets.map((a,i)=>({...a,color:['#B783BD','#B783BD','#B783BD','#B783BD','#B783BD','#B783BD','#EF3B64','#76758B','#76758B','#DDACAA','#DDACAA','#F1AB3D','#F1AB3D'][i],im:new Image()}));
Promise.all(this.assets.map(a=>new Promise((resolve,reject)=>{a.im.onload=()=>{const q=document.createElement('canvas');q.width=128;q.height=128;const g=q.getContext('2d');g.drawImage(a.im,0,0,128,128);a.alpha=g.getImageData(0,0,128,128).data;resolve()};a.im.onerror=reject;a.im.src=a.src}))).then(()=>{this.ready=true;this.focus(this.selected)}).catch(()=>document.querySelector('#art-status').textContent='Artwork could not load. Please reload.');
new ResizeObserver(()=>{this.W=host.clientWidth;this.H=host.clientHeight;c.width=this.W*devicePixelRatio;c.height=this.H*devicePixelRatio;this.draw()}).observe(host);
const pts=new Map();let prev=null;const pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};const gesture=()=>{let a=[...pts.values()];return a.length>1?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:a.length?{...a[0],d:0}:null};c.onpointerdown=e=>{cancelAnimationFrame(this.frame);c.setPointerCapture(e.pointerId);pts.set(e.pointerId,pos(e));prev=gesture()};c.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,pos(e));let a=gesture();this.x-=(a.x-prev.x)/this.z;this.y-=(a.y-prev.y)/this.z;if(a.d&&prev.d)this.zoom(a.d/prev.d,a.x,a.y);else this.draw();prev=a};c.onpointerup=c.onpointercancel=e=>{pts.delete(e.pointerId);prev=gesture()};c.addEventListener('wheel',e=>{e.preventDefault();let p=pos(e);this.zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});host.querySelectorAll('.world-controls button').forEach((b,i)=>b.onclick=()=>this.zoom(i?1/1.3:1.3));c.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();cancelAnimationFrame(this.frame);if(e.key==='+'||e.key==='=')this.zoom(1.2);else if(e.key==='-')this.zoom(1/1.2);else{this.x+=({ArrowLeft:-80,ArrowRight:80}[e.key]||0)/this.z;this.y+=({ArrowUp:-80,ArrowDown:80}[e.key]||0)/this.z;this.draw()}}};
}
zoom(f,px=this.W/2,py=this.H/2){cancelAnimationFrame(this.frame);let nz=Math.max(.22,Math.min(4,this.z*f));this.x+=(px-this.W/2)*(1/this.z-1/nz);this.y+=(py-this.H/2)*(1/this.z-1/nz);this.z=nz;this.draw()}
hash(x,y,s=0){let h=Math.imul(x,374761393)^Math.imul(y,668265263)^Math.imul(s+20261111,144269);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967296}
node(i,j){
const key=i+','+j;if(this.cache.has(key))return this.cache.get(key);
const block=Math.floor(i/13),band=Math.floor(j/13),rk=block+','+band;
if(!this.rows.has(rk)){let order=Array.from({length:13},(_,k)=>k);for(let k=12;k>0;k--){let m=Math.floor(this.hash(block,band,k)*(k+1));[order[k],order[m]]=[order[m],order[k]]}this.rows.set(rk,order)}
const a=this.assets[this.rows.get(rk)[(((i+5*j)%13)+13)%13]],size=300;
const n={...a,i,j,x:i*320+(this.hash(i,j,21)-.5)*Math.max(0,320-size*a.w/Math.max(a.w,a.h)-20),y:j*300+(this.hash(i,j,22)-.5)*Math.max(0,300-size*a.h/Math.max(a.w,a.h)-12),w:size*a.w/Math.max(a.w,a.h),h:size*a.h/Math.max(a.w,a.h)};
this.cache.set(key,n);return n
}
nearest(id){let best=null,d=Infinity,ci=Math.round(this.x/320),cj=Math.round(this.y/300);for(let j=cj-3;j<=cj+3;j++)for(let i=ci-13;i<=ci+13;i++){let n=this.node(i,j),v=(n.x-this.x)**2+(n.y-this.y)**2;if(n.id===id&&v<d){best=n;d=v}}return best}
focus(ids){
this.selected=ids.filter(id=>this.assets.some(a=>a.id===id));
let x=0,y=0,z=Math.sqrt(this.W*this.H/(320*300*5.5));
if(this.selected.length){let ns=this.selected.map(id=>this.nearest(id)),l=Math.min(...ns.map(n=>n.x-n.w/2)),r=Math.max(...ns.map(n=>n.x+n.w/2)),t=Math.min(...ns.map(n=>n.y-n.h/2)),b=Math.max(...ns.map(n=>n.y+n.h/2));x=(l+r)/2;y=(t+b)/2;z=Math.min(this.W/(r-l+230),this.H/(b-t+230),1.65)}
cancelAnimationFrame(this.frame);let from=[this.x,this.y,this.z],start=performance.now();const run=now=>{let t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/520),e=1-(1-t)**3;[this.x,this.y,this.z]=from.map((v,i)=>v+([x,y,z][i]-v)*e);this.draw();if(t<1)this.frame=requestAnimationFrame(run)};this.frame=requestAnimationFrame(run)
}
// Each 4×4 neighbourhood has a spanning tree; east/south bridges join
// neighbourhoods into one infinite connected graph, without horizontal bands.
edges(bx,by){
const key=bx+','+by;if(this.graphs.has(key))return this.graphs.get(key);
let candidates=[],parents=Array.from({length:16},(_,i)=>i),result=[];
const root=i=>parents[i]===i?i:(parents[i]=root(parents[i]));
for(let y=0;y<4;y++)for(let x=0;x<4;x++){let a=this.node(bx*4+x,by*4+y);for(const [dx,dy] of [[1,0],[0,1]]){if(x+dx>=4||y+dy>=4)continue;let b=this.node(a.i+dx,a.j+dy);const p=this.port(a,b),q=this.port(b,a);candidates.push({a,b,u:y*4+x,v:(y+dy)*4+x+dx,w:Math.hypot(p.x-q.x,p.y-q.y)*(1+this.hash(a.i,a.j,dx?51:52)*.35)})}}
candidates.sort((a,b)=>a.w-b.w);for(const e of candidates){let u=root(e.u),v=root(e.v);if(u!==v){parents[u]=v;result.push([e.a.i,e.a.j,e.b.i,e.b.j])}}
let row=Math.floor(this.hash(bx,by,60)*4),col=Math.floor(this.hash(bx,by,61)*4);
result.push([bx*4+3,by*4+row,bx*4+4,by*4+row],[bx*4+col,by*4+3,bx*4+col,by*4+4]);
this.graphs.set(key,result);return result
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
const key=b.i+','+b.j;a.ports??={};b.ports??={};const back=a.i+','+a.j;const p=a.ports[key]??=(this.port(a,b)),q=b.ports[back]??=(this.port(b,a)),g=this.g,dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len,w=5.5;
const points=[[p.x+nx*w,p.y+ny*w],[q.x+nx*w,q.y+ny*w],[q.x-nx*w,q.y-ny*w],[p.x-nx*w,p.y-ny*w]];
const shape=off=>{g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y+off):g.moveTo(x,y+off));g.closePath()};
g.strokeStyle='#243047';g.lineWidth=1.2;g.lineJoin='round';shape(5);g.fillStyle='#388887';g.fill();g.stroke();shape(0);const grad=g.createLinearGradient(p.x,p.y,q.x,q.y);grad.addColorStop(0,a.color);grad.addColorStop(1,b.color);g.fillStyle=grad;g.fill();g.stroke()
}
draw(){
if(!this.ready)return;
const g=this.g,z=this.z,W=this.W,H=this.H;g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);g.clearRect(0,0,W,H);g.fillStyle='#fff';g.fillRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z,z);g.translate(-this.x,-this.y);
let l=Math.floor((this.x-W/2/z)/320)-2,r=Math.ceil((this.x+W/2/z)/320)+2,t=Math.floor((this.y-H/2/z)/300)-2,b=Math.ceil((this.y+H/2/z)/300)+2;
for(let by=Math.floor(t/4)-1;by<=Math.floor(b/4);by++)for(let bx=Math.floor(l/4)-1;bx<=Math.floor(r/4);bx++)for(const [i,j,k,m] of this.edges(bx,by))this.bridge(this.node(i,j),this.node(k,m));
for(let j=t;j<=b;j++)for(let i=l;i<=r;i++){let n=this.node(i,j);g.drawImage(n.im,n.x-n.w/2,n.y-n.h/2,n.w,n.h);if(this.selected.includes(n.id)){g.strokeStyle='#984734';g.lineWidth=1.5/z;g.setLineDash([6/z,5/z]);g.strokeRect(n.x-n.w/2-8,n.y-n.h/2-8,n.w+16,n.h+16);g.setLineDash([])}}
g.restore();
if(this.cache.size>6000)this.cache.clear();if(this.rows.size>2000)this.rows.clear();if(this.graphs.size>2000)this.graphs.clear()
}
}
