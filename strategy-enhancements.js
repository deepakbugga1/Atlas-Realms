(()=>{
  const layerKeys=['political','terrain','resources','population','climate','military'];
  const boot=()=>{
    const shell=document.querySelector('.strategy-shell');
    const viewport=document.querySelector('#strategyViewport');
    const layers=document.querySelector('.map-layers');
    if(!shell||!viewport||!layers||shell.dataset.shortcutsReady==='1')return;
    shell.dataset.shortcutsReady='1';
    shell.setAttribute('aria-label','Atlas Realms strategy command center');
    const hint=document.createElement('div');
    hint.className='strategy-shortcuts';
    hint.setAttribute('role','note');
    hint.textContent='Shortcuts: 1–6 layers · R reset · +/- zoom · Esc close panel';
    layers.insertAdjacentElement('afterend',hint);
    const status=document.createElement('div');
    status.className='strategy-shortcut-status';
    status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');
    status.textContent='Map ready';
    layers.insertAdjacentElement('afterend',status);
    layers.querySelectorAll('button[data-layer2]').forEach(button=>{
      const label=button.dataset.layer2||'map';
      button.setAttribute('aria-label',`Show ${label} layer`);
    });
    const announce=(message)=>{status.textContent=message;};
    const updateZoom=(delta)=>{
      const svg=viewport.querySelector('svg');
      if(!svg)return;
      const current=Number(viewport.dataset.zoom||1);
      const next=Math.max(.8,Math.min(1.8,Math.round((current+delta)*10)/10));
      viewport.dataset.zoom=String(next);
      svg.style.transform=`scale(${next}) rotateX(3deg)`;
      announce(`Map zoom ${next.toFixed(1)}x`);
    };
    layers.addEventListener('click',event=>{
      const button=event.target.closest('button[data-layer2]');
      if(button)announce(`${button.dataset.layer2} layer active`);
    });
    shell.addEventListener('keydown',event=>{
      if(event.target.matches('input,textarea,select,button')) return;
      if(event.key>='1'&&event.key<='6'){
        const layer=layerKeys[Number(event.key)-1];
        const button=layers.querySelector(`[data-layer2="${layer}"]`);
        button?.click();
      }
      if(event.key.toLowerCase()==='r'){
        viewport.scrollTo({left:0,top:0,behavior:'smooth'});
        viewport.dataset.zoom='1';
        const svg=viewport.querySelector('svg');
        if(svg)svg.style.transform='rotateX(3deg)';
        announce('Map view reset');
      }
      if(event.key==='+'||event.key==='=')updateZoom(.1);
      if(event.key==='-'||event.key==='_')updateZoom(-.1);
      if(event.key==='Escape'){
        const modal=document.querySelector('.strategy-modal');
        if(modal){modal.remove();announce('Panel closed');}
      }
    });
    shell.tabIndex=0;
  };
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  boot();
})();
