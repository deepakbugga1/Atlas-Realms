(()=>{
  const layerKeys=['political','terrain','resources','population','climate','military'];
  const boot=()=>{
    const shell=document.querySelector('.strategy-shell');
    const viewport=document.querySelector('#strategyViewport');
    const layers=document.querySelector('.map-layers');
    if(!shell||!viewport||!layers||shell.dataset.shortcutsReady==='1')return;
    shell.dataset.shortcutsReady='1';
    const hint=document.createElement('div');
    hint.className='strategy-shortcuts';
    hint.setAttribute('role','note');
    hint.textContent='Shortcuts: 1–6 layers · R reset · +/- zoom · Esc close panel';
    layers.insertAdjacentElement('afterend',hint);
    const updateZoom=(delta)=>{
      const svg=viewport.querySelector('svg');
      if(!svg)return;
      const current=Number(viewport.dataset.zoom||1);
      const next=Math.max(.8,Math.min(1.8,current+delta));
      viewport.dataset.zoom=String(next);
      svg.style.transform=`scale(${next}) rotateX(3deg)`;
    };
    shell.addEventListener('keydown',event=>{
      if(event.target.matches('input,textarea,select,button')) return;
      if(event.key>='1'&&event.key<='6'){
        const button=layers.querySelector(`[data-layer2="${layerKeys[Number(event.key)-1]}"]`);
        button?.click();
      }
      if(event.key.toLowerCase()==='r'){
        viewport.scrollTo({left:0,top:0,behavior:'smooth'});
        viewport.dataset.zoom='1';
        const svg=viewport.querySelector('svg');
        if(svg)svg.style.transform='rotateX(3deg)';
      }
      if(event.key==='+'||event.key==='=')updateZoom(.1);
      if(event.key==='-'||event.key==='_')updateZoom(-.1);
      if(event.key==='Escape')document.querySelector('.strategy-modal')?.remove();
    });
    shell.tabIndex=0;
  };
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  boot();
})();
