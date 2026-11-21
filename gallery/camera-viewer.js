// Archived renderer controls. No generated-video pose estimation or synthetic paths.
(() => {
  let dataPromise;
  const data = () => dataPromise ||= fetch('gallery/cameras.json').then(r => {if (!r.ok) throw Error('Camera data'); return r.json()});
  const init = async canvas => {
    if (canvas.dataset.initialized) return;
    canvas.dataset.initialized='loading';
    try {
      const d=(await data())[canvas.dataset.camera], poses=d.poses, n=poses.length;
      const cell=canvas.closest('.camera-cell'), row=canvas.closest('.case-row'), video=row.querySelector('.output-cell video'), slider=cell.querySelector('input'), ctx=canvas.getContext('2d');
      const positions=poses.map(m=>m.slice(0,3).map(r=>r[3]));
      const lo=[0,1,2].map(k=>Math.min(...positions.map(p=>p[k]))), hi=[0,1,2].map(k=>Math.max(...positions.map(p=>p[k]))), center=lo.map((v,k)=>(v+hi[k])/2);
      const span=Math.max(.2,Math.hypot(...hi.map((v,k)=>v-lo[k]))); let yaw=-.65,pitch=.35,index=0,drag=null,W,H;
      function project(p) {
        let [x,y,z]=p.map((v,k)=>(v-center[k])/span), a=x*Math.cos(yaw)+z*Math.sin(yaw), b=-x*Math.sin(yaw)+z*Math.cos(yaw);
        return [W/2+a*Math.min(W,H)*.95,H/2+(y*Math.cos(pitch)-b*Math.sin(pitch))*Math.min(W,H)*.95];
      }
      function line(points,color,width=1) {ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();points.forEach((p,i)=>{const [x,y]=project(p);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke()}
      function frustum(i,color,width=1) {
        const m=poses[i],p=positions[i], [fx,fy]=d.frustum[i], z=span*.10;
        const corners=[[-fx,-fy],[fx,-fy],[fx,fy],[-fx,fy]].map(([x,y])=>p.map((v,k)=>v+z*(m[k][0]*x+m[k][1]*y+m[k][2])));
        line([...corners,corners[0]],color,width);corners.forEach(q=>line([p,q],color,width));
      }
      function draw() {
        const box=canvas.getBoundingClientRect();W=box.width;H=box.height;const dpi=Math.min(devicePixelRatio||1,2);
        if(canvas.width!==Math.round(W*dpi)||canvas.height!==Math.round(H*dpi)){canvas.width=Math.round(W*dpi);canvas.height=Math.round(H*dpi)}
        ctx.setTransform(dpi,0,0,dpi,0,0);ctx.fillStyle='#f8fafc';ctx.fillRect(0,0,W,H);
        const y=hi[1]+span*.22;
        for(let j=-3;j<=3;j++){const v=j*span/5;line([[center[0]+v,y,center[2]-span*.6],[center[0]+v,y,center[2]+span*.6]],'#e4e9ef');line([[center[0]-span*.6,y,center[2]+v],[center[0]+span*.6,y,center[2]+v]],'#e4e9ef')}
        line(positions,'#93a9bf',1.8);line(positions.slice(0,index+1),'#23735e',2.3);
        for(let i=0;i<n;i+=Math.max(1,Math.floor(n/5)))frustum(i,'#91a6bf',.8);
        frustum(0,'#487ab2',1.2);frustum(index,'#145e4a',1.9);
        const p=project(positions[index]);ctx.fillStyle='#145e4a';ctx.beginPath();ctx.arc(...p,3,0,2*Math.PI);ctx.fill();canvas.dataset.frame=String(index);
      }
      const reset=()=>{yaw=-.65;pitch=.35;draw()};cell.querySelector('button').addEventListener('click',reset);canvas.addEventListener('dblclick',reset);
      canvas.addEventListener('pointerdown',e=>{drag=[e.clientX,e.clientY];canvas.setPointerCapture(e.pointerId)});
      canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw+=(e.clientX-drag[0])*.012;pitch=Math.max(-1.4,Math.min(1.4,pitch+(e.clientY-drag[1])*.012));drag=[e.clientX,e.clientY];draw()});
      canvas.addEventListener('pointerup',()=>drag=null);canvas.addEventListener('pointercancel',()=>drag=null);
      canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(e.key))return;e.preventDefault();if(e.key==='Home')return reset();yaw+=e.key==='ArrowLeft'?-.12:e.key==='ArrowRight'?.12:0;pitch+=e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0;draw()});
      slider.addEventListener('input',()=>{index=+slider.value;draw();if(Number.isFinite(video.duration))video.currentTime=index/n*video.duration});
      const sync=()=>{if(!Number.isFinite(video.duration)||!video.duration)return;index=Math.min(n-1,Math.floor(video.currentTime/video.duration*n));slider.value=String(index);draw()};video.addEventListener('timeupdate',sync);video.addEventListener('seeked',sync);
      new ResizeObserver(draw).observe(canvas);canvas.dataset.initialized='ready';draw();
    } catch(e) {canvas.dataset.initialized='error';canvas.closest('.camera-frame').textContent='Unavailable';}
  };
  const canvases=[...document.querySelectorAll('canvas[data-camera]')];
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){init(e.target);io.unobserve(e.target)}}),{rootMargin:'300px'});canvases.forEach(c=>io.observe(c))}else canvases.forEach(init);
})();
