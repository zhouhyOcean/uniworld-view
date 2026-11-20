// Request video posters and metadata near the viewport; playback stays manual.
(() => { const videos=[...document.querySelectorAll('#results video')];
const prepare=v=>{if(v.dataset.poster){v.poster=v.dataset.poster;delete v.dataset.poster}v.preload='metadata';if(!v.readyState)v.load()};
if ('IntersectionObserver' in window) { const io=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){prepare(e.target);io.unobserve(e.target)}},{rootMargin:'500px 0px'});videos.forEach(v=>io.observe(v)); }
else videos.forEach(prepare);
document.addEventListener('visibilitychange',()=>{if(document.hidden)videos.forEach(v=>v.pause())});
})();
