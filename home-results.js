// Request video metadata as examples approach the viewport; playback stays manual.
(() => { const videos=[...document.querySelectorAll('#results video')];
if ('IntersectionObserver' in window) { const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const v=e.target;v.preload='metadata';if(!v.readyState)v.load();io.unobserve(v)}},{rootMargin:'500px 0px'});videos.forEach(v=>io.observe(v)); }
else videos.forEach(v=>{v.preload='metadata'});
document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause())});
})();
