// Lazy loading; playback is controlled per case and never pauses another case.
(() => {
  const videos=[...document.querySelectorAll('#results video')];
  function prepare(v,eager=false) {
    if(v.dataset.poster){v.poster=v.dataset.poster;delete v.dataset.poster}
    v.muted=true;v.playsInline=true;v.preload=eager?'auto':'metadata';
    // An observer arriving after a play gesture must not reset active playback.
    if(v.readyState===0&&v.paused&&v.networkState!==HTMLMediaElement.NETWORK_LOADING)v.load();
  }
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){prepare(e.target);io.unobserve(e.target)}},{rootMargin:'500px 0px'});videos.forEach(v=>io.observe(v))}
  else videos.forEach(v=>prepare(v));
  function ready(v) {
    if(v.readyState>=3){prepare(v,true);return Promise.resolve()}
    return new Promise((resolve,reject)=>{
      const clear=()=>{clearTimeout(timer);v.removeEventListener('canplay',ok);v.removeEventListener('error',fail)};
      const ok=()=>{clear();resolve()},fail=()=>{clear();reject(Error('Video could not load'))};
      const timer=setTimeout(fail,25000);v.addEventListener('canplay',ok,{once:true});v.addEventListener('error',fail,{once:true});
      if(v.error)v.load();prepare(v,true);if(v.readyState>=3)ok();
    });
  }
  function seek(v,t) {
    if(Math.abs(v.currentTime-t)<.035)return Promise.resolve();
    return new Promise(resolve=>{const done=()=>{clearTimeout(timer);v.removeEventListener('seeked',done);resolve()};const timer=setTimeout(done,3000);v.addEventListener('seeked',done,{once:true});v.currentTime=t});
  }
  document.querySelectorAll('#results .case-row').forEach(row=>{
    const members=[...row.querySelectorAll('video')],master=row.querySelector('.output-cell video'),play=row.querySelector('[data-compare="play"]'),pause=row.querySelector('[data-compare="pause"]'),status=row.querySelector('.comparison-status');
    if(!members.length||!master||!play)return;
    const state={active:false,busy:false,serial:0};
    function sync(){
      if(!state.active||state.busy||!Number.isFinite(master.duration)||!master.duration)return;
      const phase=master.currentTime/master.duration;
      members.forEach(v=>{if(v!==master&&v.readyState>=2&&!v.paused&&!v.seeking&&Number.isFinite(v.duration)){
        const t=Math.min(v.duration-.01,phase*v.duration);if(Math.abs(v.currentTime-t)>.18)v.currentTime=t;
      }});
    }
    master.addEventListener('timeupdate',sync);master.addEventListener('seeked',sync);
    members.forEach(v=>v.addEventListener('pause',()=>{if(!state.busy&&!v.ended)state.active=false}));
    play.addEventListener('click',async()=>{
      if(state.busy||state.active&&members.every(v=>!v.paused))return;
      const token=++state.serial;state.busy=true;state.active=false;play.disabled=true;status.textContent='Loading…';
      const start=master.ended?0:master.currentTime;members.forEach(v=>v.pause());
      try{
        await Promise.all(members.map(ready));if(token!==state.serial)return;
        const phase=master.duration?start/master.duration:0;
        await Promise.all(members.map(v=>seek(v,Math.min(v.duration-.01,phase*v.duration))));if(token!==state.serial)return;
        const results=await Promise.allSettled(members.map(v=>v.play()));if(token!==state.serial){if(!state.busy&&!state.active)members.forEach(v=>v.pause());return}
        state.active=results.every(r=>r.status==='fulfilled');status.textContent=state.active?'':'Try individual controls';row.dataset.comparing=String(state.active);
      }catch(e){if(token===state.serial)status.textContent='Could not load. Try again.'}
      finally{if(token===state.serial){state.busy=false;play.disabled=false}}
    });
    pause.addEventListener('click',()=>{state.serial++;state.active=false;state.busy=false;play.disabled=false;status.textContent='';row.dataset.comparing='false';members.forEach(v=>v.pause())});
  });
})();
