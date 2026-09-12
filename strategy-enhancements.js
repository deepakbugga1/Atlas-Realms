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
    hint.textContent='Shortcuts: 1–6 layers · R reset map · Esc close panel';
    layers.insertAdjacentElement('afterend',hint);
    shell.addEventListener('keydown',event=>{
      if(event.target.matches('input,textarea,select,button')) return;
      if(event.key>='1'&&event.key<='6'){
        const button=layers.querySelector(`[data-layer2="${layerKeys[Number(event.key)-1]}"]`);
        button?.click();
      }
      if(event.key.toLowerCase()==='r'){
        viewport.scrollTo({left:0,top:0,behavior:'smooth'});
        const svg=viewport.querySelector('svg');
        viewport.dataset.zoom='1';
        if(svg)svg.style.transform='rotateX(3deg)';
      }
      if(event.key==='Escape')document.querySelector('.strategy-modal')?.remove();
    });
    shell.tabIndex=0;
  };
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  boot();
})();
