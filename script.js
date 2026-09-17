const revealItems = document.querySelectorAll('.reveal');
const counters = document.querySelectorAll('strong[data-target]');
const copyBtn = document.getElementById('copyEmail');
const copyLabel = document.getElementById('copyLabel');
const cursorGlow = document.querySelector('.cursor-glow');
const pageFlash = document.querySelector('.page-flash');
const cursorGhosts = ['cyan', 'pink', 'purple', 'yellow'].map((tone) => {
  const ghost = document.createElement('span');
  ghost.className = `cursor-ghost cursor-ghost-${tone}`;
  ghost.setAttribute('aria-hidden', 'true');
  document.body.appendChild(ghost);
  return ghost;
});
const waveCanvas = document.getElementById('waveCanvas');
const hero = document.getElementById('hero');
const profileScreen = document.getElementById('profile');
if (profileScreen) profileScreen.remove();
const screens = [...document.querySelectorAll('main > section')];
const targetLinks = document.querySelectorAll('a[data-target]');
let activeScreen = 'hero';

if (waveCanvas && hero) {
  const waveContext = waveCanvas.getContext('2d');
  const pointer = { x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 };
  let canvasWidth = 0;
  let canvasHeight = 0;
  let pixelRatio = 1;

  const resizeWaveCanvas = () => {
    const bounds = hero.getBoundingClientRect();
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvasWidth = bounds.width;
    canvasHeight = bounds.height;
    waveCanvas.width = Math.floor(canvasWidth * pixelRatio);
    waveCanvas.height = Math.floor(canvasHeight * pixelRatio);
    waveCanvas.style.width = `${canvasWidth}px`;
    waveCanvas.style.height = `${canvasHeight}px`;
    waveContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  };

  const updateWavePointer = (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
    pointer.targetY = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
  };

  const drawWaves = (time) => {
    if (!canvasWidth || !canvasHeight) {
      resizeWaveCanvas();
    }

    pointer.x += (pointer.targetX - pointer.x) * 0.08;
    pointer.y += (pointer.targetY - pointer.y) * 0.08;
    const frequency = 0.012 + pointer.x * 0.014;
    const peakHeight = 72 + pointer.y * 105;
    const drift = time * 0.0007;
    const center = canvasHeight * 0.52;

    waveContext.clearRect(0, 0, canvasWidth, canvasHeight);
    waveContext.fillStyle = '#0a0a0a';
    waveContext.fillRect(0, 0, canvasWidth, canvasHeight);

    const terrainWave = (x, side, depth) => {
      const phase = x * frequency + drift + side * 0.35;
      const primaryWave = Math.sin(phase);
      const secondaryWave = Math.sin(phase * 2.08 + 0.7) * 0.18;
      const centerVoid = 0.92 + Math.abs(x / canvasWidth - 0.5) * 0.08;
      const depthScale = 0.35 + depth * 0.65;
      return (primaryWave + secondaryWave) * peakHeight * centerVoid * depthScale * side;
    };

    const drawWireframe = () => {
      const lineCount = 31;
      const base = center;
      const lineSpacing = 7;
      const side = 1;

      waveContext.beginPath();
      for (let x = -30; x <= canvasWidth + 30; x += 4) {
        const wave = terrainWave(x, side, 1);
        if (x === -30) waveContext.moveTo(x, center + wave - 12);
        else waveContext.lineTo(x, center + wave - 12);
      }
      for (let x = canvasWidth + 30; x >= -30; x -= 4) {
        const wave = terrainWave(x, side, 1);
        waveContext.lineTo(x, center + wave + 12);
      }
      waveContext.closePath();
      waveContext.fillStyle = 'rgba(245, 247, 248, 0.62)';
      waveContext.fill();

      for (let line = 0; line < lineCount; line += 1) {
        const distance = (line - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
        const depth = 1 - Math.abs(distance) * 0.7;
        waveContext.beginPath();
        for (let x = -30; x <= canvasWidth + 30; x += 4) {
          const y = base + distance * lineSpacing * (lineCount / 2) * 0.56 + terrainWave(x, side, depth) * (0.72 + depth * 0.28);
          if (x === -30) waveContext.moveTo(x, y);
          else waveContext.lineTo(x, y);
        }
        waveContext.strokeStyle = `rgba(248, 250, 252, ${0.13 + depth * 0.68})`;
        waveContext.lineWidth = line % 7 === 0 ? 2 : 1;
        waveContext.stroke();

        if (line % 2 === 0) {
          for (let x = 0; x < canvasWidth; x += 16) {
            const y = base + distance * lineSpacing * (lineCount / 2) * 0.56 + terrainWave(x, side, depth) * (0.72 + depth * 0.28);
            waveContext.fillStyle = `rgba(255, 255, 255, ${0.16 + depth * 0.5})`;
            waveContext.fillRect(x, y, 2, 2);
          }
        }
      }

      waveContext.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      waveContext.lineWidth = 1;
      for (let x = 16; x < canvasWidth; x += 30) {
        waveContext.beginPath();
        for (let line = 0; line < lineCount; line += 3) {
          const distance = (line - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
          const depth = 1 - Math.abs(distance) * 0.7;
          const y = base + distance * lineSpacing * (lineCount / 2) * 0.56 + terrainWave(x, side, depth) * (0.72 + depth * 0.28);
          if (line === 0) waveContext.moveTo(x, y);
          else waveContext.lineTo(x, y);
        }
        waveContext.stroke();
      }
    };

    const drawSecondaryWave = (verticalOffset, phaseOffset, amplitude) => {
      const lineCount = 9;
      const lineSpacing = 4;
      const secondaryTerrain = (x, depth) => {
        const phase = x * (frequency * 0.84) + drift * 1.35 + phaseOffset;
        const contour = Math.sin(phase) + Math.sin(phase * 2.08 + 0.7) * 0.18;
        return contour * amplitude * (0.4 + depth * 0.6);
      };

      for (let line = 0; line < lineCount; line += 1) {
        const distance = (line - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
        const depth = 1 - Math.abs(distance) * 0.65;
        waveContext.beginPath();
        for (let x = -30; x <= canvasWidth + 30; x += 4) {
          const y = center + verticalOffset + distance * lineSpacing * (lineCount / 2) + secondaryTerrain(x, depth);
          if (x === -30) waveContext.moveTo(x, y);
          else waveContext.lineTo(x, y);
        }
        waveContext.strokeStyle = `rgba(255, 255, 255, ${0.24 + depth * 0.46})`;
        waveContext.lineWidth = line === Math.floor(lineCount / 2) ? 1.5 : 1;
        waveContext.stroke();

        if (line % 2 === 0) {
          for (let x = 10; x < canvasWidth; x += 24) {
            const y = center + verticalOffset + distance * lineSpacing * (lineCount / 2) + secondaryTerrain(x, depth);
            waveContext.fillStyle = `rgba(255, 255, 255, ${0.3 + depth * 0.35})`;
            waveContext.fillRect(x, y, 2, 2);
          }
        }
      }

      waveContext.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      waveContext.lineWidth = 1;
      for (let x = 18; x < canvasWidth; x += 32) {
        waveContext.beginPath();
        for (let line = 0; line < lineCount; line += 2) {
          const distance = (line - (lineCount - 1) / 2) / ((lineCount - 1) / 2);
          const depth = 1 - Math.abs(distance) * 0.65;
          const y = center + verticalOffset + distance * lineSpacing * (lineCount / 2) + secondaryTerrain(x, depth);
          if (line === 0) waveContext.moveTo(x, y);
          else waveContext.lineTo(x, y);
        }
        waveContext.stroke();
      }
    };

    drawWireframe();
    drawSecondaryWave(-48, 1.4, 48);
    drawSecondaryWave(48, 4.1, 42);

    requestAnimationFrame(drawWaves);
  };

  hero.addEventListener('pointermove', updateWavePointer, { passive: true });
  hero.addEventListener('pointerleave', () => {
    pointer.targetX = 0.5;
    pointer.targetY = 0.5;
  });
  window.addEventListener('resize', resizeWaveCanvas);
  resizeWaveCanvas();
  requestAnimationFrame(drawWaves);
}

function animateScreenCounters(screen) {
  screen.querySelectorAll('strong[data-target]').forEach((counter) => {
    if (counter.dataset.counted) return;
    counter.dataset.counted = 'true';
    animateCounter(counter);
  });
}

function activateScreen(target, updateUrl = true) {
  const nextScreen = screens.find((screen) => screen.id === target) || screens[0];
  if (!nextScreen) return;
  const currentIndex = screens.findIndex((screen) => screen.id === activeScreen);
  const nextIndex = screens.indexOf(nextScreen);
  const direction = nextIndex >= currentIndex ? 'forward' : 'backward';

  screens.forEach((screen) => {
    const isActive = screen === nextScreen;
    screen.classList.toggle('screen-active', isActive);
    screen.setAttribute('aria-hidden', String(!isActive));
    screen.classList.remove('screen-forward', 'screen-backward', 'screen-exit');
    if (isActive) screen.classList.add(`screen-${direction}`);
  });

  targetLinks.forEach((link) => {
    link.classList.toggle('is-active', link.dataset.target === nextScreen.id);
  });

  nextScreen.querySelectorAll('.reveal').forEach((item) => item.classList.add('visible'));
  animateScreenCounters(nextScreen);
  if (pageFlash) {
    pageFlash.classList.remove('flash-active');
    void pageFlash.offsetWidth;
    pageFlash.classList.add('flash-active');
  }
  activeScreen = nextScreen.id;
  if (updateUrl) history.replaceState(null, '', `#${nextScreen.id}`);
}

targetLinks.forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    activateScreen(link.dataset.target);
  });
});

window.addEventListener('keydown', (event) => {
  if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return;
  event.preventDefault();
  const currentIndex = screens.findIndex((screen) => screen.id === activeScreen);
  const direction = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1;
  const nextIndex = (currentIndex + direction + screens.length) % screens.length;
  activateScreen(screens[nextIndex].id);
});

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    observer.unobserve(entry.target);
  });
}, { threshold: 0.14 });
revealItems.forEach((item) => revealObserver.observe(item));

function animateCounter(element) {
  const target = Number(element.dataset.target || 0);
  const start = performance.now();
  const tick = (now) => {
    const progress = Math.min((now - start) / 1300, 1);
    element.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3))));
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const counterObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    animateCounter(entry.target);
    observer.unobserve(entry.target);
  });
}, { threshold: 0.6 });
counters.forEach((counter) => counterObserver.observe(counter));

const initialScreen = window.location.hash.slice(1);
activateScreen(initialScreen || 'hero', false);

if (copyBtn && copyLabel) {
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText('3013817289@qq.com');
      copyLabel.textContent = 'COPIED';
    } catch {
      copyLabel.textContent = 'SELECTED';
    }
    setTimeout(() => { copyLabel.textContent = 'COPY'; }, 1400);
  });
}

if (cursorGlow) {
  const cursorPosition = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const ghostPositions = cursorGhosts.map(() => ({ x: cursorPosition.x, y: cursorPosition.y }));
  let cursorSpeed = 0;
  let lastPointerTime = performance.now();

  window.addEventListener('pointermove', (event) => {
    const now = performance.now();
    const elapsed = Math.max(now - lastPointerTime, 8);
    const distance = Math.hypot(event.clientX - cursorPosition.x, event.clientY - cursorPosition.y);
    cursorSpeed = Math.min(distance / elapsed * 2.2, 1);
    lastPointerTime = now;
    cursorPosition.x = event.clientX;
    cursorPosition.y = event.clientY;
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
  }, { passive: true });

  const animateCursorGhosts = () => {
    cursorSpeed *= 0.9;
    ghostPositions.forEach((position, index) => {
      const leader = index === 0 ? cursorPosition : ghostPositions[index - 1];
      const lag = 0.5 - index * 0.055;
      position.x += (leader.x - position.x) * lag;
      position.y += (leader.y - position.y) * lag;
      const trailSpread = 0.3 + cursorSpeed * 1.1;
      const offsetX = (index % 2 === 0 ? 1 : -1) * (index + 1) * 7 * trailSpread;
      const offsetY = (index % 2 === 0 ? -1 : 1) * (index + 1) * 4 * trailSpread;
      const glitchX = (Math.random() - 0.5) * cursorSpeed * 42;
      const glitchY = (Math.random() - 0.5) * cursorSpeed * 18;
      const slice = Math.random() < cursorSpeed * 0.7 ? Math.random() * 70 : 0;
      cursorGhosts[index].style.setProperty('--glitch-x', `${glitchX}px`);
      cursorGhosts[index].style.setProperty('--glitch-y', `${glitchY}px`);
      cursorGhosts[index].style.setProperty('--glitch-opacity', `${0.42 + cursorSpeed * 0.58}`);
      cursorGhosts[index].style.setProperty('--glitch-slice', `${slice}%`);
      cursorGhosts[index].style.transform = `translate(${position.x + offsetX}px, ${position.y + offsetY}px) rotate(${index % 2 ? -8 : 8}deg) skewX(${(Math.random() - 0.5) * cursorSpeed * 18}deg)`;
    });
    requestAnimationFrame(animateCursorGhosts);
  };

  requestAnimationFrame(animateCursorGhosts);
}

document.querySelectorAll('[data-tilt]').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const box = card.getBoundingClientRect();
    const rotateX = ((event.clientY - box.top) / box.height - 0.5) * -5;
    const rotateY = ((event.clientX - box.left) / box.width - 0.5) * 5;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
  });
  card.addEventListener('pointerleave', () => { card.style.transform = ''; });
});

const japaneseExperience = [
  {
    time: '2022.09 — 2026.06',
    tag: '教育',
    title: '広東科技学院',
    role: '文学学士 / 日本語 / GPA 2.93 / 5.00 / 平均点 80.99 / 100',
    points: [
      '日本語翻訳、高級日本語視聴会話、逐次通訳入門、日本語学などの専門科目を履修。',
      '映像日本語、異文化コミュニケーション、日本社会文化を通して、日本文化とメディア芸術を理解。',
      '日本語、英語、中国語を体系的に学び、多文化・異文化の視点を身につけた。',
    ],
  },
  {
    time: '2025.07 — 2025.09',
    tag: 'インターンシップ',
    title: '広州新龍科技有限公司',
    role: '営業部インターン',
    points: [
      '部門間の事業連携とパートナーとの連絡を支援し、商務資料の準備と調整を担当。',
      '企業のデジタルマーケティング戦略を分析し、公式アカウントとショート動画の発信を観察。',
      'オンライン購入チャネルのページ設計に参加し、アクセス性と顧客体験を改善。',
    ],
  },
];

document.querySelectorAll('.erase-zone').forEach((zone, index) => {
  const japanese = japaneseExperience[index];
  const fields = {
    time: zone.querySelector('time'),
    tag: zone.querySelector('.tag'),
    title: zone.querySelector('h3'),
    role: zone.querySelector('.role'),
    points: [...zone.querySelectorAll('li')],
  };
  const chinese = Object.fromEntries(Object.entries(fields).map(([key, value]) => [
    key,
    Array.isArray(value) ? value.map((item) => item.textContent) : value?.textContent,
  ]));

  const fieldEntries = [
    { element: fields.time, key: 'time' },
    { element: fields.tag, key: 'tag' },
    { element: fields.title, key: 'title' },
    { element: fields.role, key: 'role' },
    ...fields.points.map((element, pointIndex) => ({ element, key: 'points', pointIndex })),
  ];

  const setFieldLanguage = (field, language) => {
    const copy = language === 'ja' ? japanese : chinese;
    const value = field.key === 'points' ? copy.points[field.pointIndex] : copy[field.key];
    field.element.textContent = value;
    field.element.classList.toggle('is-erased', language === 'ja');
  };

  const restoreZone = () => {
    fieldEntries.forEach((field) => setFieldLanguage(field, 'cn'));
    zone.classList.remove('is-translated');
  };

  zone.addEventListener('pointermove', (event) => {
    const bounds = zone.getBoundingClientRect();
    zone.style.setProperty('--eraser-x', `${event.clientX - bounds.left}px`);
    zone.style.setProperty('--eraser-y', `${event.clientY - bounds.top}px`);

    let translatedField = false;
    fieldEntries.forEach((field) => {
      const fieldBounds = field.element.getBoundingClientRect();
      const closestX = Math.max(fieldBounds.left, Math.min(event.clientX, fieldBounds.right));
      const closestY = Math.max(fieldBounds.top, Math.min(event.clientY, fieldBounds.bottom));
      const distance = Math.hypot(event.clientX - closestX, event.clientY - closestY);
      const isCovered = distance < 76;
      setFieldLanguage(field, isCovered ? 'ja' : 'cn');
      translatedField ||= isCovered;
    });
    zone.classList.toggle('is-translated', translatedField);
  }, { passive: true });
  zone.addEventListener('pointerleave', restoreZone);
});
