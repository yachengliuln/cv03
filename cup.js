import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const visualStyle = document.createElement('style');
visualStyle.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap');
  .outro .outro-copy{position:relative;z-index:7;transform:translateX(21vw)}
  .cup-stage{position:absolute;z-index:4;left:5vw;right:auto;top:13vh;width:min(88vw,1120px);height:min(61vh,600px);cursor:grab;touch-action:none}
  .cup-stage:active{cursor:grabbing}.cup-stage canvas{width:100%;height:100%;outline:none}
  .cup-stage:after{content:'PREPARING A TOAST';position:absolute;inset:0;display:grid;place-items:center;color:var(--ink);font-size:10px;letter-spacing:.16em;pointer-events:none}
  .cup-stage.cup-ready:after{display:none}.cup-stage.is-toasting{cursor:default}
  .cup-guide{position:absolute;z-index:8;left:50%;bottom:7vh;transform:translateX(-50%);padding:8px 13px;border:1px solid var(--ink);background:var(--paper);font-size:9px;letter-spacing:.16em;pointer-events:none;transition:opacity .35s,transform .35s}
  .cup-guide:before{content:'✦';margin-right:7px;color:#b98218;font-size:13px;animation:guide-glow 1.7s ease-in-out infinite alternate}.cup-stage.is-toasting+.cup-guide{opacity:0;transform:translate(-50%,8px)}
  .cheers-word{position:absolute;z-index:9;left:50%;top:37vh;pointer-events:none;color:#a57011;font-family:'Caveat','Segoe Script',cursive;font-size:clamp(50px,8vw,105px);line-height:1;opacity:0;transform:translate(-50%,14px) rotate(-5deg);text-shadow:0 3px 18px rgba(238,190,67,.38);transition:opacity .28s ease,transform .55s cubic-bezier(.18,.9,.25,1)}
  .cheers-word.show{opacity:1;transform:translate(-50%,0) rotate(-5deg)}
  @keyframes guide-glow{to{color:#dfb748;text-shadow:0 0 12px rgba(223,183,72,.85)}}
  @media(max-width:700px){.outro .outro-copy{transform:none;align-self:end;margin-bottom:5vh}.cup-stage{left:4vw;top:9vh;width:92vw;height:57vh}.cup-guide{bottom:5vh;white-space:nowrap}.cheers-word{top:32vh}.cup-note{z-index:8;left:7vw;bottom:4vh;background:transparent;color:#fff;mix-blend-mode:difference}}
`;
document.head.append(visualStyle);
const layoutStyle = document.createElement('style');
layoutStyle.textContent = `.cup-note{position:absolute;z-index:8;left:5vw;bottom:5vh;margin:0;padding:7px 9px;background:var(--paper);font-size:10px;line-height:1.7;letter-spacing:.13em}`;
document.head.append(layoutStyle);

const stage = document.querySelector('#cupStage');
const note = document.querySelector('.cup-note');
if (note) note.innerHTML = 'CLICK OR DRAG A CUP<br>点击或拖动酒杯，开始碰杯';

const guide = document.createElement('div');
guide.className = 'cup-guide';
guide.textContent = 'CLICK OR DRAG TO TOAST';
stage?.after(guide);
const word = document.createElement('div');
word.className = 'cheers-word';
word.textContent = 'Cheers!';
stage?.after(word);

if (stage) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, .1, 100);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  camera.position.set(0, .1, 5.45);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  stage.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xfff8dc, 0x254c89, 2.6));
  const key = new THREE.DirectionalLight(0xffffff, 4.1); key.position.set(2.8, 5, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf1c968, 2.2); rim.position.set(-4, 1, 3); scene.add(rim);

  const makeGlowTexture = () => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 1, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255,250,210,1)'); gradient.addColorStop(.22, 'rgba(246,206,102,.9)'); gradient.addColorStop(.58, 'rgba(224,169,49,.25)'); gradient.addColorStop(1, 'rgba(224,169,49,0)');
    context.fillStyle = gradient; context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
  };
  const glowTexture = makeGlowTexture();
  const flash = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0xffd66a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  flash.position.set(0, .05, .28); flash.scale.set(.1, .1, 1); scene.add(flash);

  const bubbles = Array.from({ length: 20 }, () => {
    const material = new THREE.SpriteMaterial({ map: glowTexture, color: 0xffe6a1, transparent: true, opacity: 0, depthWrite: false });
    const bubble = new THREE.Sprite(material); bubble.visible = false; bubble.userData = { offset: 0, drift: 0, size: 0 };
    scene.add(bubble); return bubble;
  });
  const ribbonTexture = (() => { const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 80; const context = canvas.getContext('2d'); context.strokeStyle = '#fff'; context.lineWidth = 18; context.lineCap = 'round'; context.beginPath(); context.moveTo(12, 58); context.bezierCurveTo(53, 7, 118, 76, 168, 21); context.stroke(); return new THREE.CanvasTexture(canvas); })();
  const ribbonColors = [0xe33d2e, 0x195bbd, 0xf6c738, 0xf0eee8];
  const ribbons = Array.from({ length: 32 }, (_, index) => {
    const material = new THREE.SpriteMaterial({ map: ribbonTexture, color: ribbonColors[index % ribbonColors.length], transparent: true, opacity: 0, depthWrite: false });
    const ribbon = new THREE.Sprite(material); ribbon.visible = false; ribbon.userData = { velocity: new THREE.Vector3(), spin: 0, phase: 0 }; scene.add(ribbon); return ribbon;
  });

  let leftCup, rightCup, leftLiquid, rightLiquid;
  let toastStart = -1, impactFired = false, wordTimer;
  const baseLeft = new THREE.Vector3(-1.34, -.2, 0);
  const baseRight = new THREE.Vector3(1.34, -.2, 0);
  const meetLeft = new THREE.Vector3(-.25, .02, .08);
  const meetRight = new THREE.Vector3(.25, .02, .08);
  let variation = { y: 0, tilt: 0, speed: 1 };

  const easeOut = value => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 3);
  const setGlassMaterials = object => object.traverse(node => {
    if (!node.isMesh) return;
    node.frustumCulled = false;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    materials.forEach(material => { if (material) { material.side = THREE.DoubleSide; material.envMapIntensity = 1.2; material.needsUpdate = true; } });
  });
  const makeLiquid = (rawBox, rawSize, rawCenter) => {
    const radius = Math.min(rawSize.x, rawSize.z) * .27;
    const liquid = new THREE.Mesh(new THREE.CircleGeometry(radius, 64), new THREE.MeshPhysicalMaterial({ color: 0xc98b36, transparent: true, opacity: .58, roughness: .18, metalness: .04, clearcoat: .55, side: THREE.DoubleSide, depthWrite: false }));
    liquid.rotation.x = -Math.PI / 2;
    liquid.position.set(rawCenter.x, rawBox.min.y + rawSize.y * .72, rawCenter.z);
    return liquid;
  };

  const resetBubbles = () => bubbles.forEach((bubble, index) => {
    bubble.visible = true;
    bubble.userData.offset = Math.random() * .42;
    bubble.userData.drift = (Math.random() - .5) * .36;
    bubble.userData.size = .035 + Math.random() * .07;
    bubble.position.set((Math.random() - .5) * .36, -.04 + Math.random() * .2, .25 + Math.random() * .2);
    bubble.scale.setScalar(bubble.userData.size);
    bubble.material.opacity = .72 - index * .018;
  });
  const resetRibbons = () => ribbons.forEach(ribbon => {
    const angle = Math.random() * Math.PI * 2;
    const speed = .04 + Math.random() * .06;
    ribbon.visible = true; ribbon.position.set((Math.random() - .5) * .08, .05 + (Math.random() - .5) * .08, .36 + Math.random() * .1);
    ribbon.userData.velocity.set(Math.cos(angle) * speed, Math.sin(angle) * speed * .45 + .065, .025 + Math.random() * .05);
    ribbon.userData.spin = (Math.random() - .5) * .26;
    ribbon.userData.phase = Math.random() * Math.PI * 2;
    ribbon.material.rotation = Math.random() * Math.PI;
    ribbon.material.opacity = .96;
    ribbon.scale.set(.28 + Math.random() * .32, .11 + Math.random() * .09, 1);
  });

  const playChime = () => {
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return;
    const audio = new Audio();
    const now = audio.currentTime;
    [[2180, .11, .06], [3110, .08, .045], [1380, .15, .03]].forEach(([frequency, duration, volume], index) => {
      const oscillator = audio.createOscillator(); const gain = audio.createGain();
      oscillator.type = index === 2 ? 'sine' : 'triangle'; oscillator.frequency.setValueAtTime(frequency, now); oscillator.frequency.exponentialRampToValueAtTime(frequency * .985, now + duration);
      gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .012); gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
      oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + .03);
    });
  };

  const showWord = () => {
    word.textContent = 'Cheers!';
    word.classList.add('show'); clearTimeout(wordTimer);
    wordTimer = setTimeout(() => word.classList.remove('show'), 1450);
  };
  const triggerToast = () => {
    const now = performance.now();
    if (toastStart > 0 && now - toastStart < 850) return;
    toastStart = now; impactFired = false;
    variation = { y: (Math.random() - .5) * .16, tilt: (Math.random() - .5) * .12, speed: .92 + Math.random() * .18 };
    stage.classList.add('is-toasting');
    setTimeout(() => stage.classList.remove('is-toasting'), 1100);
  };

  new FBXLoader().load('cup-model/source/unpacked/cup_lp.fbx', object => {
    const rawBox = new THREE.Box3().setFromObject(object);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const rawCenter = rawBox.getCenter(new THREE.Vector3());
    leftCup = object;
    leftCup.position.sub(rawCenter).add(baseLeft);
    leftCup.scale.setScalar(2.08 / rawSize.length());
    leftCup.rotation.set(.02, -.32, -.08);
    setGlassMaterials(leftCup); scene.add(leftCup);
    leftLiquid = makeLiquid(rawBox, rawSize, rawCenter); leftCup.add(leftLiquid);
    rightCup = leftCup.clone(true);
    rightCup.position.copy(baseRight); rightCup.rotation.set(.02, .32, .08);
    setGlassMaterials(rightCup); scene.add(rightCup);
    rightLiquid = rightCup.children.find(child => child.geometry?.type === 'CircleGeometry');
    stage.classList.add('cup-ready');
  }, undefined, () => stage.classList.add('cup-error'));

  stage.addEventListener('pointerdown', event => { event.preventDefault(); triggerToast(); });
  stage.addEventListener('pointermove', event => { if (event.buttons) triggerToast(); }, { passive: true });
  stage.addEventListener('wheel', event => event.stopPropagation(), { capture: true });

  const resize = () => { const { width, height } = stage.getBoundingClientRect(); camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height, false); };
  new ResizeObserver(resize).observe(stage); resize();

  function render(time = 0) {
    requestAnimationFrame(render);
    const elapsed = toastStart < 0 ? 99 : (time - toastStart) / 1000 * variation.speed;
    let contact = 0;
    if (elapsed >= 0 && elapsed < 1.22) {
      contact = elapsed < .54 ? easeOut(elapsed / .54) : 1 - easeOut((elapsed - .54) / .68);
      const impact = Math.exp(-Math.pow((elapsed - .54) / .075, 2));
      if (!impactFired && elapsed >= .51) {
        impactFired = true; flash.material.opacity = .96; flash.scale.set(.12, .12, 1); resetBubbles(); resetRibbons(); playChime(); showWord();
      }
      if (leftCup && rightCup) {
        leftCup.position.lerpVectors(baseLeft, meetLeft, contact); rightCup.position.lerpVectors(baseRight, meetRight, contact);
        leftCup.position.y += variation.y * contact + Math.sin(time * .012) * impact * .025;
        rightCup.position.y -= variation.y * contact - Math.sin(time * .012) * impact * .025;
        leftCup.rotation.z = -.08 - (.25 + variation.tilt) * contact + impact * .12;
        rightCup.rotation.z = .08 + (.25 + variation.tilt) * contact - impact * .12;
        leftCup.rotation.y = -.32 + .18 * contact; rightCup.rotation.y = .32 - .18 * contact;
        if (leftLiquid && rightLiquid) { leftLiquid.rotation.z = Math.sin(time * .016) * (.035 + impact * .09); rightLiquid.rotation.z = -Math.sin(time * .016) * (.035 + impact * .09); }
      }
      flash.material.opacity *= .91; flash.scale.multiplyScalar(1.085);
    } else if (leftCup && rightCup) {
      leftCup.position.lerp(baseLeft, .08); rightCup.position.lerp(baseRight, .08);
      leftCup.rotation.z += (-.08 - leftCup.rotation.z) * .08; rightCup.rotation.z += (.08 - rightCup.rotation.z) * .08;
      leftCup.rotation.y += (-.32 - leftCup.rotation.y) * .08; rightCup.rotation.y += (.32 - rightCup.rotation.y) * .08;
    }
    bubbles.forEach(bubble => {
      if (!bubble.visible) return;
      bubble.userData.offset += .012 + Math.random() * .006;
      bubble.position.y += .014 + Math.random() * .008;
      bubble.position.x += Math.sin(bubble.userData.offset * 9) * .0018 + bubble.userData.drift * .0015;
      bubble.material.opacity *= .975;
      bubble.scale.multiplyScalar(1.006);
      if (bubble.material.opacity < .025) bubble.visible = false;
    });
    ribbons.forEach(ribbon => {
      if (!ribbon.visible) return;
      ribbon.position.add(ribbon.userData.velocity);
      ribbon.userData.velocity.y -= .00105;
      ribbon.userData.velocity.multiplyScalar(.978);
      ribbon.userData.phase += .13;
      ribbon.position.x += Math.sin(ribbon.userData.phase) * .0032;
      ribbon.position.z += Math.cos(ribbon.userData.phase * .7) * .002;
      ribbon.material.rotation += ribbon.userData.spin + Math.sin(ribbon.userData.phase) * .016;
      ribbon.material.opacity *= .965;
      ribbon.scale.x *= 1.007; ribbon.scale.y *= 1.002;
      if (ribbon.material.opacity < .025) ribbon.visible = false;
    });
    renderer.render(scene, camera);
  }
  render();
}
