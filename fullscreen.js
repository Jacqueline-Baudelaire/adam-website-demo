(() => {
  const root=document.documentElement;
  const controls=world.host.querySelector('.world-controls');
  const buttons={};
  let mode=null,native=false;
  for(const key of ['page','art']){
    const button=document.createElement('button');
    button.type='button';button.className='world-fullscreen';
    button.dataset.fullscreen=key;buttons[key]=button;controls.append(button);
    button.addEventListener('click',async()=>{
      cancelAnimationFrame(world.frame);
      if(mode===key){await leave(button);return;}
      sync(key);
      if(!document.fullscreenElement&&root.requestFullscreen&&document.fullscreenEnabled){
        try{await root.requestFullscreen();native=true;}catch{native=false;}
      }
    });
  }
  function sync(value){
    mode=value;document.body.classList.toggle('art-fullscreen',value==='art');
    for(const [key,button] of Object.entries(buttons)){
      const label=key==='page'?'Page full screen':'Art full screen';
      button.textContent=value===key?'⤢ Exit full screen':'⛶ '+label;
      button.setAttribute('aria-label',value===key?'Exit full screen':label);
      button.setAttribute('aria-pressed',String(value===key));
      button.title=value===key?'Exit full screen (Esc)':key==='page'?'Full website: title, index and artwork':'Artwork only';
    }
  }
  async function leave(button=buttons[mode]||buttons.page){
    if(document.fullscreenElement){await document.exitFullscreen();}
    native=false;sync(null);button.focus({preventScroll:true});
  }
  document.addEventListener('fullscreenchange',()=>{
    if(document.fullscreenElement){native=true;}
    else if(native){native=false;sync(null);}
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&mode&&!document.querySelector('dialog[open]')){
      e.preventDefault();leave();
    }
  });
  sync(null);
})();
