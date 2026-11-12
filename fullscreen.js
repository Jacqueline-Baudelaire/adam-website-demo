(() => {
  const root=document.documentElement;
  const button=document.createElement('button');
  button.type='button';button.className='world-fullscreen';
  world.host.querySelector('.world-controls').append(button);
  let active=false,native=false;
  function sync(value){
    active=value;document.body.classList.toggle('art-fullscreen',value);
    button.textContent=value?'⤢ Exit full screen':'⛶ Full screen';
    button.setAttribute('aria-label',value?'Exit full screen':'Enter full screen');
    button.setAttribute('aria-pressed',String(value));
    button.title=value?'Exit full screen (Esc)':'Full screen';
  }
  async function leave(){
    if(native&&document.fullscreenElement){await document.exitFullscreen();}
    native=false;sync(false);button.focus({preventScroll:true});
  }
  button.addEventListener('click',async()=>{
    cancelAnimationFrame(world.frame);
    if(active){await leave();return;}
    sync(true);
    if(root.requestFullscreen&&document.fullscreenEnabled){
      try{await root.requestFullscreen();native=true;}catch{native=false;}
    }
  });
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement){native=true;sync(true);}
    else if(native){native=false;sync(false);button.focus({preventScroll:true});}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&active&&!document.querySelector('dialog[open]')){
      e.preventDefault();leave();
    }
  });
  sync(false);
})();
