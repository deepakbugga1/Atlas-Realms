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
    hint.textContent='Shortcuts: 1–6 layers · 0 political · M military · S search · R reset · +/- zoom · ? help · Esc close panel';
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
    const restoreZoom=()=>{
      const nextViewport=document.querySelector('#strategyViewport');
      const svg=nextViewport?.querySelector('svg');
      if(!nextViewport||!svg)return;
      const saved=Number(shell.dataset.mapZoom||1);
      nextViewport.dataset.zoom=String(saved);
      svg.style.transform=`scale(${saved}) rotateX(3deg)`;
    };
    const updateZoom=(delta)=>{
      const current=Number(shell.dataset.mapZoom||viewport.dataset.zoom||1);
      const next=Math.max(.8,Math.min(1.8,Math.round((current+delta)*10)/10));
      shell.dataset.mapZoom=String(next);
      const currentViewport=document.querySelector('#strategyViewport');
      const svg=currentViewport?.querySelector('svg');
      if(!currentViewport||!svg)return;
      currentViewport.dataset.zoom=String(next);
      svg.style.transform=`scale(${next}) rotateX(3deg)`;
      announce(`Map zoom ${next.toFixed(1)}x`);
    };
    const activateLayer=(name)=>{
      const button=layers.querySelector(`[data-layer2="${name}"]`);
      button?.click();
      announce(`${name} layer active`);
    };
    layers.addEventListener('click',event=>{
      const button=event.target.closest('button[data-layer2]');
      if(button){announce(`${button.dataset.layer2} layer active`);queueMicrotask(restoreZoom);}
    });
    shell.addEventListener('keydown',event=>{
      if(event.target.matches('input,textarea,select,button')) return;
      const key=event.key.toLowerCase();
      if(event.key>='1'&&event.key<='6') activateLayer(layerKeys[Number(event.key)-1]);
      if(event.key==='0') activateLayer('political');
      if(key==='m') activateLayer('military');
      if(key==='s'){
        const search=document.querySelector('#strategySearch');
        if(search){search.focus();search.select();announce('Province search focused');}
      }
      if(key==='r'){
        shell.dataset.mapZoom='1';
        const currentViewport=document.querySelector('#strategyViewport');
        currentViewport?.scrollTo({left:0,top:0,behavior:'smooth'});
        restoreZoom();
        announce('Map view reset');
      }
      if(event.key==='+'||event.key==='=')updateZoom(.1);
      if(event.key==='-'||event.key==='_')updateZoom(-.1);
      if(event.key==='?'){
        hint.hidden=!hint.hidden;
        announce(hint.hidden?'Shortcut help hidden':'Shortcut help shown');
      }
      if(event.key==='Escape'){
        const modal=document.querySelector('.strategy-modal');
        if(modal){modal.remove();announce('Panel closed');}
      }
    });
    shell.tabIndex=0;
    restoreZoom();
  };
  new MutationObserver(boot).observe(document.body,{childList:true,subtree:true});
  boot();
})();
