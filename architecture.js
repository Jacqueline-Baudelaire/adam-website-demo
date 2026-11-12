class ArchitectureWorld {
constructor(host){
this.host=host;host.innerHTML='<canvas class="architecture-canvas" tabindex="0" aria-label="Archive architecture. Drag to pan, scroll to zoom, arrow keys to move, plus and minus to zoom."></canvas><div class="world-controls"><button type="button" aria-label="Zoom in">+</button><button type="button" aria-label="Zoom out">−</button></div>';
const c=this.c=host.querySelector('canvas'),g=this.g=c.getContext('2d');this.W=1;this.H=1;this.x=768;this.y=512;this.z=1;this.selected=[];this.im=new Image();this.im.onload=()=>{this.repair=new Image();this.repair.onload=()=>{this.overview=document.createElement('canvas');this.overview.width=1536;this.overview.height=1024;const ctx=this.overview.getContext('2d');ctx.drawImage(this.im,0,0,1536,1024);for(const r of ArchitectureWorld.repairRegions)ctx.drawImage(this.repair,...r);this.buildMasks(this.overview);this.overviewMasks=this.masks;this.relayout();this.ready=true;this.focus(this.selected)};this.repair.onerror=this.im.onerror;this.repair.src=window.bridgeRepairParts.join('')};this.im.onerror=()=>{document.querySelector('#art-status').textContent='Artwork could not load. Please reload.'};this.im.src=window.jennyImageParts.join('');
new ResizeObserver(()=>{this.W=host.clientWidth;this.H=host.clientHeight;c.width=this.W*devicePixelRatio;c.height=this.H*devicePixelRatio;this.draw()}).observe(host);
const pts=new Map();let prev=null;const pos=e=>{const r=c.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};const gesture=()=>{let a=[...pts.values()];return a.length>1?{x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2,d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}:a.length?{...a[0],d:0}:null};c.onpointerdown=e=>{cancelAnimationFrame(this.frame);c.setPointerCapture(e.pointerId);pts.set(e.pointerId,pos(e));prev=gesture()};c.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,pos(e));let a=gesture();this.x-=(a.x-prev.x)/this.z;this.y-=(a.y-prev.y)/this.z;if(a.d&&prev.d)this.zoom(a.d/prev.d,a.x,a.y);else this.draw();prev=a};c.onpointerup=c.onpointercancel=e=>{pts.delete(e.pointerId);prev=gesture()};c.addEventListener('wheel',e=>{e.preventDefault();let p=pos(e);this.zoom(Math.exp(-e.deltaY*.0015),p.x,p.y)},{passive:false});host.querySelectorAll('.world-controls button').forEach((b,i)=>b.onclick=()=>this.zoom(i?1/1.3:1.3));c.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-'].includes(e.key)){e.preventDefault();cancelAnimationFrame(this.frame);if(e.key==='+'||e.key==='=')this.zoom(1.2);else if(e.key==='-')this.zoom(1/1.2);else{this.x+=({ArrowLeft:-80,ArrowRight:80}[e.key]||0)/this.z;this.y+=({ArrowUp:-80,ArrowDown:80}[e.key]||0)/this.z;this.draw()}}};
}
zoom(f,px=this.W/2,py=this.H/2){cancelAnimationFrame(this.frame);let nz=Math.max(.08,Math.min(4,this.z*f));this.x+=(px-this.W/2)*(1/this.z-1/nz);this.y+=(py-this.H/2)*(1/this.z-1/nz);this.z=nz;this.draw()}
focus(ids){this.selected=ids.filter(id=>ArchitectureWorld.boxes[id]);const boxes=this.selected.map(id=>ArchitectureWorld.boxes[id]);let x=(this.sceneW||1536)/2,y=(this.sceneH||1024)/2,z=Math.min(this.W/((this.sceneW||1536)+8),this.H/((this.sceneH||1024)+8));if(boxes.length){let l=Math.min(...boxes.map(b=>b[0])),t=Math.min(...boxes.map(b=>b[1])),r=Math.max(...boxes.map(b=>b[0]+b[2])),b=Math.max(...boxes.map(b=>b[1]+b[3]));x=(l+r)/2;y=(t+b)/2;z=Math.min(this.W/(r-l+160),this.H/(b-t+160),1.8)}cancelAnimationFrame(this.frame);let from=[this.x,this.y,this.z],start=performance.now();const run=now=>{let t=matchMedia('(prefers-reduced-motion: reduce)').matches?1:Math.min(1,(now-start)/520),e=1-(1-t)**3;[this.x,this.y,this.z]=from.map((v,i)=>v+([x,y,z][i]-v)*e);this.draw();if(t<1)this.frame=requestAnimationFrame(run)};this.frame=requestAnimationFrame(run)}

buildMasks(source=this.im){
const W=1536,H=1024,N=W*H,c=document.createElement('canvas');c.width=W;c.height=H;
const ctx=c.getContext('2d');ctx.drawImage(source,0,0,W,H);const data=ctx.getImageData(0,0,W,H).data;
const ids=Object.keys(ArchitectureWorld.boxes),labels=new Int8Array(N).fill(-1),seen=new Uint8Array(N),queue=new Int32Array(N);
const prototypes=[
['P02',450,65,710,388],['P05',525,307,991,659],['P14',690,674,1166,1014],
['P01',30,24,449,464],['P10',1122,28,1515,438],['P12',16,592,343,1000],['P13',1234,468,1519,883],
['P06',800,22,1092,330],['P09',404,752,678,1002],['P11',1061,266,1273,535],['P03',30,465,521,604],
['P08',298,618,617,875],['P11',945,346,1107,548],['P04',1133,579,1272,802],['P04',1044,552,1144,698],['P04',1041,688,1157,745]
];
const ink=k=>data[k*4]+data[k*4+1]+data[k*4+2]<720;
this.componentAudit=[];
for(let k=0;k<N;k++){
if(seen[k]||!ink(k))continue;let head=0,tail=1;queue[0]=k;seen[k]=1;let l=W,r=0,t=H,b=0;
while(head<tail){const v=queue[head++],x=v%W,y=(v/W)|0;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
for(const a of [x?v-1:-1,x<W-1?v+1:-1,y?v-W:-1,y<H-1?v+W:-1])if(a>=0&&!seen[a]&&ink(a)){seen[a]=1;queue[tail++]=a}}
if(tail<100)continue;
const joined=tail>200000&&l>400&&l<500;
let pid=null;
if(!joined){let best=Infinity;for(const [id,pl,pt,pr,pb] of prototypes){const d=(l-pl)**2+(t-pt)**2+(r-pr)**2+(b-pb)**2;if(d<best){best=d;pid=id}}}
for(let q=0;q<tail;q++){const v=queue[q],x=v%W,y=(v/W)|0;const id=joined?(x<725&&y<392?'P02':y>665?'P14':'P05'):pid;labels[v]=ids.indexOf(id)}
this.componentAudit.push({project:joined?'P02/P05/P14':pid,pixels:tail});
}
// Include the antialiased edge pixels immediately beside each solid component.
const expanded=labels.slice();
for(let k=0;k<N;k++)if(labels[k]<0){const x=k%W,y=(k/W)|0;for(const v of [x?k-1:-1,x<W-1?k+1:-1,y?k-W:-1,y<H-1?k+W:-1])if(v>=0&&labels[v]>=0){expanded[k]=labels[v];break}}
this.masks={};
for(let i=0;i<ids.length;i++){
let l=W,r=0,t=H,b=0;for(let k=0;k<N;k++)if(expanded[k]===i){const x=k%W,y=(k/W)|0;l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}
const out=document.createElement('canvas');out.width=r-l+1;out.height=b-t+1;const g=out.getContext('2d'),pixels=g.createImageData(out.width,out.height);
for(let y=t;y<=b;y++)for(let x=l;x<=r;x++){const k=y*W+x;if(expanded[k]!==i)continue;const q=((y-t)*out.width+x-l)*4;pixels.data[q]=data[k*4];pixels.data[q+1]=data[k*4+1];pixels.data[q+2]=data[k*4+2];pixels.data[q+3]=255}
g.putImageData(pixels,0,0);this.masks[ids[i]]={canvas:out,x:l,y:t};
}
}
relayout(){
const layout=ArchitectureWorld.layout;this.sceneW=layout.W;this.sceneH=layout.H;
const scene=document.createElement('canvas');scene.width=layout.W;scene.height=layout.H;const g=scene.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,scene.width,scene.height);
for(const a of layout.placed){const m=this.overviewMasks[a.id],c=document.createElement('canvas');c.width=Math.round(a.w);c.height=Math.round(a.h);c.getContext('2d').drawImage(m.canvas,0,0,c.width,c.height);m.canvas=c;m.x=a.x;m.y=a.y;ArchitectureWorld.boxes[a.id]=[a.x,a.y,c.width,c.height];g.drawImage(c,a.x,a.y);}
this.overview=scene;
}
draw(){if(!this.ready)return;const g=this.g,z=this.z,W=this.W,H=this.H;g.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);g.clearRect(0,0,W,H);g.save();g.translate(W/2,H/2);g.scale(z,z);g.translate(-this.x,-this.y);g.fillStyle='#fff';g.fillRect(0,0,this.sceneW||1536,this.sceneH||1024);
g.globalAlpha=this.selected.length?.2:1;g.drawImage(this.overview,0,0);g.globalAlpha=1;
for(const id of this.selected){const m=this.overviewMasks[id];if(m)g.drawImage(m.canvas,m.x,m.y)}
g.restore();
}
}
ArchitectureWorld.boxes={P01:[20,20,430,450],P02:[445,65,275,330],P03:[25,460,500,145],P04:[1040,550,240,250],P05:[520,310,480,350],P06:[795,25,300,305],P08:[300,615,325,255],P09:[425,750,260,250],P10:[1120,20,405,420],P11:[940,265,340,285],P12:[15,590,330,415],P13:[1250,470,275,415],P14:[685,675,485,340]};


ArchitectureWorld.repairRegions=[[0,0,175,95,530,365,175,95],[175,0,170,160,675,615,170,160]];

ArchitectureWorld.layout={"W": 2908, "H": 1636, "placed": [{"id": "P05", "x": 980, "y": 608, "w": 517, "h": 391}, {"id": "P02", "x": 740, "y": 164, "w": 415, "h": 547}, {"id": "P11", "x": 1496, "y": 416, "w": 563, "h": 485}, {"id": "P14", "x": 1256, "y": 1052, "w": 484, "h": 342}, {"id": "P06", "x": 1208, "y": 32, "w": 491, "h": 518}, {"id": "P08", "x": 500, "y": 968, "w": 528, "h": 427}, {"id": "P09", "x": 800, "y": 1184, "w": 452, "h": 413}, {"id": "P04", "x": 1796, "y": 956, "w": 517, "h": 559}, {"id": "P03", "x": 260, "y": 728, "w": 664, "h": 191}, {"id": "P01", "x": 128, "y": 80, "w": 571, "h": 600}, {"id": "P10", "x": 1856, "y": 32, "w": 620, "h": 646}, {"id": "P13", "x": 2312, "y": 692, "w": 563, "h": 817}, {"id": "P12", "x": 32, "y": 920, "w": 521, "h": 649}]};
