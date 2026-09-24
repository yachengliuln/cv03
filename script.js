const importMap=document.createElement('script');importMap.type='importmap';importMap.textContent=JSON.stringify({imports:{three:'https://unpkg.com/three@0.181.0/build/three.module.js','three/addons/':'https://unpkg.com/three@0.181.0/examples/jsm/'}});document.head.append(importMap);
const heroLayerStyle=document.createElement('style');heroLayerStyle.textContent='.hero{isolation:isolate}.hero-shapes{position:absolute;inset:0;z-index:0;pointer-events:none}.hero-copy{position:relative;z-index:2}.hero .scroll-note{z-index:3}';document.head.append(heroLayerStyle);
const panels=[...document.querySelectorAll('.panel')];
const progressBar=document.querySelector('.progress span');
const progressLabel=document.querySelector('.progress b');
let active=0,locked=false,touchStart=0;

const controls=document.createElement('div');controls.className='page-controls';controls.innerHTML='<button type="button" aria-label="上一页">↑</button><button type="button" aria-label="下一页">↓</button>';document.body.append(controls);

function switchPage(direction){if(locked)return;const next=active+direction;if(next<0||next>=panels.length)return;locked=true;const current=panels[active],incoming=panels[next];const exitClass=direction>0?'exit-next':'exit-prev',enterClass=direction>0?'enter-next':'enter-prev';incoming.className=`${incoming.className} is-active ${enterClass}`;current.classList.add(exitClass);setTimeout(()=>{current.classList.remove('is-active',exitClass);incoming.classList.remove(enterClass);active=next;progressBar.style.setProperty('--progress',`${active/(panels.length-1)*100}%`);progressLabel.textContent=String(active+1).padStart(2,'0');locked=false},680)}
panels[0].classList.add('is-active');progressBar.style.setProperty('--progress','0%');
addEventListener('wheel',event=>{if(Math.abs(event.deltaY)>18)switchPage(event.deltaY>0?1:-1)},{passive:true});
addEventListener('keydown',event=>{if(['ArrowDown','ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();switchPage(1)}if(['ArrowUp','ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();switchPage(-1)}});
addEventListener('touchstart',event=>touchStart=event.changedTouches[0].clientY,{passive:true});addEventListener('touchend',event=>{const distance=touchStart-event.changedTouches[0].clientY;if(Math.abs(distance)>45)switchPage(distance>0?1:-1)},{passive:true});
controls.children[0].addEventListener('click',()=>switchPage(-1));controls.children[1].addEventListener('click',()=>switchPage(1));
