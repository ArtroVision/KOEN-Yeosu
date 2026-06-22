/* ??? JavaScript: Smart LOTO Kiosk App ??? */

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Screen Navigation ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
const checkoutStepLabels = [
  '모드 선택',
  'REG TAG',
  '안전 검증',
  '보관함 위치',
  '경로 안내',
  '반출 완료'
];

const returnStepLabels = [
  '키 홀더 RFID',
  '보관함 위치',
  '반납 완료'
];

const checkoutStepByScreen = {
  'checkout-mode': 1,
  checkout: 2,
  'checkout-check': 3,
  'loading-validate': 3,
  'checkout-conflict': 3,
  'checkout-mtr-solo': 3,
  'checkout-mtr-solo-step2': 3,
  'checkout-mtr-solo-step3': 3,
  'checkout-normal': 4,
  'checkout-insulation-map': 4,
  'checkout-feedback': 5,
  'checkout-end': 6
};

const returnStepByScreen = {
  'return-key-rfid': 1,
  'return-loading': 2,
  'return-slot': 2,
  'return-end': 3
};

function ensureCheckoutStepNav(screen, name) {
  const currentStep = checkoutStepByScreen[name];
  if (!screen || !currentStep) return;

  let nav = screen.querySelector('.checkout-step-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'checkout-step-nav';
    nav.setAttribute('aria-label', '키 반출 진행 단계');
    screen.appendChild(nav);
  }

  nav.innerHTML = `
    <ol class="checkout-step-list">
      ${checkoutStepLabels.map((label, index) => {
        const stepNo = index + 1;
        const stateClass = stepNo < currentStep ? ' is-complete' : stepNo === currentStep ? ' is-current' : '';
        return `
          <li class="checkout-step-item${stateClass}">
            <span class="checkout-step-no">${String(stepNo).padStart(2, '0')}</span>
            <span class="checkout-step-label">${label}</span>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function ensureReturnStepNav(screen, name) {
  const currentStep = returnStepByScreen[name];
  if (!screen || !currentStep) return;

  let nav = screen.querySelector('.return-step-nav');
  if (!nav) {
    nav = document.createElement('nav');
    nav.className = 'return-step-nav';
    nav.setAttribute('aria-label', '키 반납 진행 단계');
    screen.appendChild(nav);
  }

  nav.innerHTML = `
    <ol class="return-step-list">
      ${returnStepLabels.map((label, index) => {
        const stepNo = index + 1;
        const stateClass = stepNo < currentStep ? ' is-complete' : stepNo === currentStep ? ' is-current' : '';
        return `
          <li class="return-step-item${stateClass}">
            <span class="return-step-no">${String(stepNo).padStart(2, '0')}</span>
            <span class="return-step-label">${label}</span>
          </li>
        `;
      }).join('')}
    </ol>
  `;
}

function goScreen(name) {
  document.querySelectorAll('.kiosk-screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById('screen-' + name);
  if (target) {
    target.classList.add('active');
    ensureCheckoutStepNav(target, name);
    ensureReturnStepNav(target, name);
  }
  if (name === 'status') buildKeyGrid();
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Global LOTO Key State ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
let checkedOutKeys = new Set([12, 7, 11, 15, 19, 22, 27, 31, 35, 38, 41, 45]);
let statusKeyPage = 'left';

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Clock ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function updateClocks() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const str = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  document.querySelectorAll('[id^="clock-"]').forEach(el => el.textContent = str);
}
setInterval(updateClocks, 1000);
updateClocks();

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Theme Toggle ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function toggleTheme() {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  // ?뺤쟻 諛곌꼍???꾪솴??Status) 罹붾쾭?ㅻ쭔 ???뚮쭏 ?됱긽?쇰줈 利됱떆 ?ㅼ떆 洹몃┰?덈떎.
  // (?ㅼ떆媛??吏곸씠??罹붾쾭?ㅻ뱾? 湲곗〈 ?좊땲硫붿씠??猷⑦봽???섑빐 留??꾨젅???먮룞 媛깆떊?⑸땲??
  drawStatusBg();
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Key Grid (Status) ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
function setStatusKeyPage(page) {
  if (page !== 'left' && page !== 'right') return;
  const prev = statusKeyPage;
  statusKeyPage = page;
  const slideClass = prev === page ? '' : page === 'left' ? 'is-sliding-right' : 'is-sliding-left';
  buildKeyGrid(slideClass);
}

function buildKeyGrid(slideClass = '') {
  const gridTop = document.getElementById('key-grid-top');
  const gridBottom = document.getElementById('key-grid-bottom');
  if (!gridTop || !gridBottom) return;

  const totalKeys = 90;
  gridTop.innerHTML = '';
  gridBottom.innerHTML = '';

  let outCount = 0;

  for (let i = 1; i <= totalKeys; i++) {
    if (checkedOutKeys.has(i)) outCount++;
  }

  function createKeySvg(i) {
    const num = String(i).padStart(2, '0');
    const isOut = checkedOutKeys.has(i);

    const bgFill = isOut ? '#fee2e2' : '#f4f5f7'; 
    const strokeColor = isOut ? '#f87171' : '#d1d5db';
    const boxFill = isOut ? '#991b1b' : '#767171';

    return `
      <svg viewBox="0 0 160 53" style="width:100%; height:auto;" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="158" height="51" rx="6" fill="${bgFill}" stroke="${strokeColor}" stroke-width="2" />
        <rect x="52.5" y="6.5" width="55" height="40" rx="4" fill="${boxFill}" />
        <rect x="35" y="23.5" width="90" height="6" rx="3" fill="#D0CECE" />
        <text x="80" y="20.5" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${num}</text>
      </svg>
    `;
  }

  // Render 1-45 keys to gridTop
  for (let i = 1; i <= 45; i++) {
    const cell = document.createElement('div');
    cell.innerHTML = createKeySvg(i);
    cell.style.display = 'flex';
    cell.title = checkedOutKeys.has(i) ? `키 ${i}: 반출 중` : `키 ${i}: 보관 중`;
    gridTop.appendChild(cell);
  }

  // Render 46-90 keys to gridBottom
  for (let i = 46; i <= totalKeys; i++) {
    const cell = document.createElement('div');
    cell.innerHTML = createKeySvg(i);
    cell.style.display = 'flex';
    cell.title = checkedOutKeys.has(i) ? `키 ${i}: 반출 중` : `키 ${i}: 보관 중`;
    gridBottom.appendChild(cell);
  }

  const totalEl = document.querySelector('.stat-total .stat-num');
  const outEl = document.querySelector('.stat-out .stat-num');
  const inEl = document.querySelector('.stat-in .stat-num');

  if (totalEl) totalEl.textContent = totalKeys;
  if (outEl) outEl.textContent = outCount;
  if (inEl) inEl.textContent = totalKeys - outCount;
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Checkout Flow Simulation (Steps 2 - 6) ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??
let ttsSpeech = null;
let ttsInterval = null;

let selectedCheckoutMode = 'normal';

function selectCheckoutMode(mode) {
  selectedCheckoutMode = mode;
  goScreen('checkout');
}

function simulateBarcodeScan() {
  const hasConflict = checkedOutKeys.has(2);
  runValidationFlow(hasConflict);
}

let validationTimer = null;

function setValStepStatus(stepNum, statusClass, statusText, symbol = null) {
  const stepEl = document.getElementById(`val-step-${stepNum}`);
  if (!stepEl) return;
  
  stepEl.className = `val-item ${statusClass}`;
  
  const statusEl = stepEl.querySelector('.val-status');
  if (statusEl) {
    statusEl.textContent = statusText;
  }
  
  const iconWrapEl = stepEl.querySelector('.val-icon-wrap');
  if (iconWrapEl) {
    if (symbol !== null) {
      iconWrapEl.textContent = symbol;
    } else {
      iconWrapEl.textContent = stepNum;
    }
  }
}

function runValidationFlow(hasConflict) {
  if (validationTimer) {
    clearTimeout(validationTimer);
    validationTimer = null;
  }
  
  goScreen('loading-validate');
  
  setValStepStatus(1, 'val-pending', '대기 중');
  setValStepStatus(2, 'val-pending', '대기 중');
  
  const actionsEl = document.getElementById('validation-result-actions');
  const btnNext = document.getElementById('btn-validation-next');
  const btnFail = document.getElementById('btn-validation-fail');
  if (actionsEl) actionsEl.style.display = 'none';
  if (btnNext) {
    btnNext.textContent = '검증 완료 - 다음 단계로';
    btnNext.style.display = 'none';
  }
  if (btnFail) btnFail.style.display = 'none';

  validationTimer = setTimeout(() => {
    setValStepStatus(1, 'val-loading', '동기화 중...');
    
    validationTimer = setTimeout(() => {
      setValStepStatus(1, 'val-success', '완료', '✓');
      setValStepStatus(2, 'val-loading', '검증 중...');
      
      validationTimer = setTimeout(() => {
        if (hasConflict) {
          if (selectedCheckoutMode === 'mtr-solo') {
            setValStepStatus(2, 'val-warning', '대여 중 (승인 필요)', '⚠');
            if (actionsEl) {
              actionsEl.style.display = 'flex';
              actionsEl.style.justifyContent = 'center';
            }
            if (btnNext) {
              btnNext.textContent = '단독기동 확인 진행';
              btnNext.style.display = 'block';
            }
            if (btnFail) btnFail.style.display = 'none';
          } else {
            setValStepStatus(2, 'val-failure', '대여 중 (차단)', '✗');
            if (actionsEl) {
              actionsEl.style.display = 'flex';
              actionsEl.style.justifyContent = 'center';
            }
            if (btnFail) btnFail.style.display = 'block';
            if (btnNext) btnNext.style.display = 'none';
          }
        } else {
          setValStepStatus(2, 'val-success', '완료', '✓');
          if (actionsEl) {
            actionsEl.style.display = 'flex';
            actionsEl.style.justifyContent = 'center';
          }
          if (btnNext) {
            btnNext.textContent = '검증 완료 - 다음 단계로';
            btnNext.style.display = 'block';
          }
          if (btnFail) btnFail.style.display = 'none';
        }
      }, 1200);
      
    }, 1000);
    
  }, 400);
}

function skipValidationAnimation(hasConflict) {
  if (validationTimer) {
    clearTimeout(validationTimer);
    validationTimer = null;
  }
  
  if (hasConflict) {
    if (selectedCheckoutMode === 'mtr-solo') {
      goScreen('checkout-mtr-solo');
    } else {
      handleValidationFailure();
    }
  } else {
    setValStepStatus(1, 'val-success', '완료', '✓');
    setValStepStatus(2, 'val-success', '완료', '✓');
    
    const actionsEl = document.getElementById('validation-result-actions');
    const btnNext = document.getElementById('btn-validation-next');
    const btnFail = document.getElementById('btn-validation-fail');
    
    if (actionsEl) {
      actionsEl.style.display = 'flex';
      actionsEl.style.justifyContent = 'center';
    }
    if (btnNext) {
      btnNext.textContent = '검증 완료 - 다음 단계로';
      btnNext.style.display = 'block';
    }
    if (btnFail) btnFail.style.display = 'none';
  }
}

function proceedAfterValidation() {
  if (selectedCheckoutMode === 'mtr-solo' && checkedOutKeys.has(2)) {
    goScreen('checkout-mtr-solo');
  } else if (selectedCheckoutMode === 'normal' || selectedCheckoutMode === 'mtr-solo' || selectedCheckoutMode === 'insulation') {
    goScreen('checkout-normal');
  }
}

function handleValidationFailure() {
  goScreen('checkout-conflict');
}

function cancelCheckoutFlow() {
  if (validationTimer) {
    clearTimeout(validationTimer);
    validationTimer = null;
  }
  goScreen('main');
}

function selectBreaker(id, markerEl, listEl) {
  const rootStyle = getComputedStyle(document.documentElement);
  const bgCard = rootStyle.getPropertyValue('--bg-card').trim();
  const borderColor = rootStyle.getPropertyValue('--border-color').trim();
  const accentCyan = rootStyle.getPropertyValue('--accent-cyan').trim() || '#38bdf8';

  // Highlight marker
  document.querySelectorAll('.map-marker-btn').forEach(btn => {
    btn.style.transform = 'scale(1)';
    btn.style.boxShadow = '0 0 15px rgba(255,255,255,0.2)';
    btn.style.border = 'none';
  });
  if (markerEl) {
    markerEl.style.transform = 'scale(1.2)';
    markerEl.style.boxShadow = '0 0 25px ' + markerEl.style.backgroundColor;
    markerEl.style.border = '2px solid white';
  }
  
  // Highlight list
  document.querySelectorAll('.breaker-list-btn').forEach(btn => {
    btn.style.background = bgCard;
    btn.style.borderColor = borderColor;
  });
  if (listEl) {
    listEl.style.background = 'var(--bg-card-hover)';
    listEl.style.borderColor = accentCyan;
  } else if (!listEl && !markerEl) {
     // fallback if neither is provided
  }
  
  document.getElementById('selected-breaker-name').innerText = id;
  document.getElementById('breaker-selection-result').style.display = 'block';
}

function startConflictFlow() {
  goScreen('checkout-conflict');
}

function stopConflictVoiceAndGoMain() {
  if (ttsInterval) {
    clearInterval(ttsInterval);
    ttsInterval = null;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  goScreen('main');
}

function goToStep5Feedback() {
  goScreen('checkout-feedback');
}

function goToStep6End() {
  goScreen('checkout-end');
  
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const reportTimeEl = document.getElementById('end-sync-time');
  if (reportTimeEl) reportTimeEl.textContent = timeStr;
}

function completeCheckoutFlowAndGoMain() {
  // 2번 보관함을 '불출 됨'으로 설정
  checkedOutKeys.add(2);
  buildKeyGrid(); // 격리판 반영
  goScreen('main');
}

// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Return Flow ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

let returnFlowTimer = null;

function startReturnFlow() {
  goScreen('return-loading');
  returnFlowTimer = setTimeout(() => {
    goScreen('return-slot');
  }, 3000);
}

function goToReturnEnd() {
  goScreen('return-end');
  
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const reportTimeEl = document.getElementById('return-sync-time');
  if (reportTimeEl) reportTimeEl.textContent = timeStr;
}

function completeReturnFlowAndGoMain() {
  // 2번 슬롯을 '보관 중'으로 복구
  checkedOutKeys.delete(2);
  buildKeyGrid();
  goScreen('main');
}


// ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??Canvas Animations ?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧?먥븧??

// ?? Helpers ??
function isDark() { return document.documentElement.dataset.theme !== 'light'; }

function getColors() {
  return isDark()
    ? { bg: '#050d1a', blue: '#3b82f6', cyan: '#06b6d4', violet: '#818cf8', dim: 'rgba(255,255,255,0.04)' }
    : { bg: '#dce8ff', blue: '#2563eb', cyan: '#0284c7', violet: '#6366f1', dim: 'rgba(30,60,120,0.06)' };
}

// ?? Main Background: floating circuit nodes ??
const mainCanvas = document.getElementById('canvas-main');
const mainCtx = mainCanvas.getContext('2d');
let mainNodes = [], mainRaf;

function initMainCanvas() {
  mainCanvas.width = mainCanvas.offsetWidth;
  mainCanvas.height = mainCanvas.offsetHeight;
  const N = 60;
  mainNodes = Array.from({ length: N }, () => ({
    x: Math.random() * mainCanvas.width,
    y: Math.random() * mainCanvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    color: ['#3b82f6', '#06b6d4', '#818cf8'][Math.floor(Math.random() * 3)]
  }));
}

function drawMainBg() {
  if (!mainCanvas.width) initMainCanvas();
  const w = mainCanvas.width, h = mainCanvas.height;
  const c = getColors();
  mainCtx.clearRect(0, 0, w, h);

  // Gradient bg
  const grad = mainCtx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.8);
  if (isDark()) {
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#050d1a');
  } else {
    grad.addColorStop(0, '#c7d9f8');
    grad.addColorStop(1, '#dce8ff');
  }
  mainCtx.fillStyle = grad;
  mainCtx.fillRect(0, 0, w, h);



  // Connections
  mainCtx.lineWidth = isDark() ? 0.95 : 0.5;
  for (let i = 0; i < mainNodes.length; i++) {
    for (let j = i + 1; j < mainNodes.length; j++) {
      const dx = mainNodes[i].x - mainNodes[j].x;
      const dy = mainNodes[i].y - mainNodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.18) {
        mainCtx.globalAlpha = (1 - dist / (w * 0.18)) * (isDark() ? 0.4 : 0.4);
        mainCtx.strokeStyle = c.blue;
        mainCtx.beginPath();
        mainCtx.moveTo(mainNodes[i].x, mainNodes[i].y);
        mainCtx.lineTo(mainNodes[j].x, mainNodes[j].y);
        mainCtx.stroke();
      }
    }
  }
  mainCtx.globalAlpha = 1;

  // Nodes
  mainNodes.forEach(n => {
    mainCtx.beginPath();
    const radius = isDark() ? n.r * 2.5 : n.r * 2;
    mainCtx.arc(n.x, n.y, radius, 0, Math.PI * 2);
    mainCtx.fillStyle = n.color;
    mainCtx.shadowColor = n.color;
    mainCtx.shadowBlur = isDark() ? 14 : 8;
    mainCtx.fill();
    mainCtx.shadowBlur = 0;

    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
  });

  mainRaf = requestAnimationFrame(drawMainBg);
}

// ?? Checkout Background: energy flow lines ??
const coCanvas = document.getElementById('canvas-checkout');
const coCtx = coCanvas.getContext('2d');
let coParticles = [], coRaf, coT = 0;

function initCoCanvas() {
  coCanvas.width = coCanvas.offsetWidth;
  coCanvas.height = coCanvas.offsetHeight;
  coParticles = Array.from({ length: 40 }, () => makeCoParticle(coCanvas.width, coCanvas.height));
}

function makeCoParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    speed: Math.random() * 1.2 + 0.4,
    angle: Math.PI * 2 * Math.random(),
    size: Math.random() * 3 + 1,
    life: Math.random(),
    maxLife: Math.random() * 0.5 + 0.5,
    color: ['#3b82f6', '#06b6d4', '#818cf8', '#60a5fa'][Math.floor(Math.random() * 4)]
  };
}

function drawCheckoutBg() {
  if (!coCanvas.width) initCoCanvas();
  const w = coCanvas.width, h = coCanvas.height;
  coT++;

  const grad = coCtx.createLinearGradient(0, 0, 0, h);
  if (isDark()) {
    grad.addColorStop(0, '#030d20');
    grad.addColorStop(0.5, '#061525');
    grad.addColorStop(1, '#030d20');
  } else {
    grad.addColorStop(0, '#c5d8f8');
    grad.addColorStop(1, '#dce8ff');
  }
  coCtx.fillStyle = grad;
  coCtx.fillRect(0, 0, w, h);



  // Particles
  coParticles.forEach((p, i) => {
    p.life += 0.008;
    if (p.life > p.maxLife) { coParticles[i] = makeCoParticle(w, h); return; }
    const alpha = Math.sin(p.life / p.maxLife * Math.PI);
    coCtx.globalAlpha = alpha * 0.8;
    coCtx.fillStyle = p.color;
    coCtx.shadowColor = p.color;
    coCtx.shadowBlur = 12;
    coCtx.beginPath();
    coCtx.arc(p.x + Math.cos(p.angle) * p.speed * coT * 0.3 % w,
      p.y + Math.sin(p.angle) * p.speed * coT * 0.3 % h, p.size, 0, Math.PI * 2);
    coCtx.fill();
    coCtx.shadowBlur = 0;
  });
  coCtx.globalAlpha = 1;

  requestAnimationFrame(drawCheckoutBg);
}

// ?? Return Background: green flow particles (same style as checkout) ??
const retCanvas = document.getElementById('canvas-return');
const retCtx = retCanvas ? retCanvas.getContext('2d') : null;
let retParticles = [], retRaf, retT = 0;

function initRetCanvas() {
  if (!retCanvas) return;
  retCanvas.width = retCanvas.offsetWidth;
  retCanvas.height = retCanvas.offsetHeight;
  retParticles = Array.from({ length: 40 }, () => makeRetParticle(retCanvas.width, retCanvas.height));
}

function makeRetParticle(w, h) {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    speed: Math.random() * 1.2 + 0.4,
    angle: Math.PI * 2 * Math.random(),
    size: Math.random() * 3 + 1,
    life: Math.random(),
    maxLife: Math.random() * 0.5 + 0.5,
    color: ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][Math.floor(Math.random() * 4)]
  };
}

function drawReturnBg() {
  if (!retCanvas || !retCtx) return;
  if (!retCanvas.width) initRetCanvas();
  const w = retCanvas.width, h = retCanvas.height;
  retT++;

  const grad = retCtx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, w * 0.7);
  if (isDark()) {
    grad.addColorStop(0, '#041a10');
    grad.addColorStop(1, '#030d0a');
  } else {
    grad.addColorStop(0, '#c5f0e0');
    grad.addColorStop(1, '#d8f5eb');
  }
  retCtx.fillStyle = grad;
  retCtx.fillRect(0, 0, w, h);

  // Particles
  retParticles.forEach((p, i) => {
    p.life += 0.008;
    if (p.life > p.maxLife) { retParticles[i] = makeRetParticle(w, h); return; }
    const alpha = Math.sin(p.life / p.maxLife * Math.PI);
    retCtx.globalAlpha = alpha * 0.8;
    retCtx.fillStyle = p.color;
    retCtx.shadowColor = p.color;
    retCtx.shadowBlur = 12;
    retCtx.beginPath();
    retCtx.arc(p.x + Math.cos(p.angle) * p.speed * retT * 0.3 % w,
      p.y + Math.sin(p.angle) * p.speed * retT * 0.3 % h, p.size, 0, Math.PI * 2);
    retCtx.fill();
    retCtx.shadowBlur = 0;
  });
  retCtx.globalAlpha = 1;

  requestAnimationFrame(drawReturnBg);
}

// ── Status Background: subtle dark ──
const stCanvas = document.getElementById('canvas-status');
const stCtx = stCanvas.getContext('2d');

function initStCanvas() {
  stCanvas.width = stCanvas.offsetWidth;
  stCanvas.height = stCanvas.offsetHeight;
}

function drawStatusBg() {
  if (!stCanvas.width) initStCanvas();
  const w = stCanvas.width, h = stCanvas.height;
  const grad = stCtx.createLinearGradient(0, 0, w, h);
  if (isDark()) {
    grad.addColorStop(0, '#06111f');
    grad.addColorStop(1, '#0a1628');
  } else {
    grad.addColorStop(0, '#dde8fa');
    grad.addColorStop(1, '#c8d9f6');
  }
  stCtx.fillStyle = grad;
  stCtx.fillRect(0, 0, w, h);
}

// ── Status List Background ──
const stListCanvas = document.getElementById('canvas-status-list');
const stListCtx = stListCanvas ? stListCanvas.getContext('2d') : null;
let stListNodes = [], stListRaf;

function initStListCanvas() {
  if (!stListCanvas) return;
  stListCanvas.width = stListCanvas.offsetWidth;
  stListCanvas.height = stListCanvas.offsetHeight;
  const N = 60;
  stListNodes = Array.from({ length: N }, () => ({
    x: Math.random() * stListCanvas.width,
    y: Math.random() * stListCanvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    color: ['#3b82f6', '#06b6d4', '#818cf8'][Math.floor(Math.random() * 3)]
  }));
}

function drawStatusListBg() {
  if (!stListCanvas || !stListCanvas.width) initStListCanvas();
  if (!stListCanvas) return;
  const w = stListCanvas.width, h = stListCanvas.height;
  const c = getColors();
  stListCtx.clearRect(0, 0, w, h);

  const grad = stListCtx.createRadialGradient(w * 0.5, h * 0.35, 0, w * 0.5, h * 0.35, w * 0.8);
  if (isDark()) {
    grad.addColorStop(0, '#0a1628');
    grad.addColorStop(1, '#050d1a');
  } else {
    grad.addColorStop(0, '#c7d9f8');
    grad.addColorStop(1, '#dce8ff');
  }
  stListCtx.fillStyle = grad;
  stListCtx.fillRect(0, 0, w, h);

  for (let i = 0; i < stListNodes.length; i++) {
    for (let j = i + 1; j < stListNodes.length; j++) {
      const dx = stListNodes[i].x - stListNodes[j].x;
      const dy = stListNodes[i].y - stListNodes[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < w * 0.18) {
        stListCtx.globalAlpha = (1 - dist / (w * 0.18)) * (isDark() ? 0.4 : 0.4);
        stListCtx.strokeStyle = c.blue;
        stListCtx.beginPath();
        stListCtx.moveTo(stListNodes[i].x, stListNodes[i].y);
        stListCtx.lineTo(stListNodes[j].x, stListNodes[j].y);
        stListCtx.stroke();
      }
    }
  }
  stListCtx.globalAlpha = 1;

  stListNodes.forEach(n => {
    stListCtx.beginPath();
    const radius = isDark() ? n.r * 2.5 : n.r * 2;
    stListCtx.arc(n.x, n.y, radius, 0, Math.PI * 2);
    stListCtx.fillStyle = n.color;
    stListCtx.shadowColor = n.color;
    stListCtx.shadowBlur = isDark() ? 14 : 8;
    stListCtx.fill();
    stListCtx.shadowBlur = 0;

    n.x += n.vx; n.y += n.vy;
    if (n.x < 0 || n.x > w) n.vx *= -1;
    if (n.y < 0 || n.y > h) n.vy *= -1;
  });

  stListRaf = requestAnimationFrame(drawStatusListBg);
}

// ═══════════════ Init ═══════════════
window.addEventListener('load', () => {
  // Init all canvases
  ['main', 'checkout', 'return', 'status', 'status-list'].forEach(id => {
    const c = document.getElementById('canvas-' + id);
    if (c) {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
    }
  });

  initMainCanvas();
  initCoCanvas();
  initRetCanvas();
  initStCanvas();
  initStListCanvas();

  drawMainBg();
  drawCheckoutBg();
  drawReturnBg();
  drawStatusBg();
  drawStatusListBg();
});

window.addEventListener('resize', () => {
  ['main', 'checkout', 'return', 'status', 'status-list'].forEach(id => {
    const c = document.getElementById('canvas-' + id);
    if (c) {
      c.width = c.offsetWidth;
      c.height = c.offsetHeight;
    }
  });
  initMainCanvas();
  initCoCanvas();
  initRetCanvas();
  initStListCanvas();
});

// ═══════════════ Emergency Flow ═══════════════
document.querySelectorAll('.btn-emergency').forEach(btn => {
  btn.style.opacity = '1';
  btn.style.cursor = 'pointer';
  btn.onclick = () => goScreen('emergency-rfid');
});

function executeEmergencyOpen() {
  goScreen('emergency-complete');
}

// ═══════════════ Emergency Selective Open Flow ═══════════════
let selectiveOpenSlots = new Set();

function buildSelectiveGrid() {
  const gridTop = document.getElementById('selective-grid-top');
  const gridBottom = document.getElementById('selective-grid-bottom');
  if (!gridTop || !gridBottom) return;

  selectiveOpenSlots.clear();
  gridTop.innerHTML = '';
  gridBottom.innerHTML = '';

  function createSelectableSlot(i, container) {
    const num = String(i).padStart(2, '0');
    const cell = document.createElement('div');
    cell.id = 'sel-slot-' + i;
    cell.style.cssText = 'display: flex; cursor: pointer; transition: transform 0.1s;';
    cell.innerHTML = `
      <svg viewBox="0 0 160 53" style="width:100%; height:auto;" xmlns="http://www.w3.org/2000/svg">
        <rect class="sel-bg" x="1" y="1" width="158" height="51" rx="6" fill="#f4f5f7" stroke="#d1d5db" stroke-width="2" />
        <rect class="sel-box" x="52.5" y="6.5" width="55" height="40" rx="4" fill="#767171" />
        <rect x="35" y="23.5" width="90" height="6" rx="3" fill="#D0CECE" />
        <text x="80" y="20.5" fill="#ffffff" font-family="sans-serif" font-size="12" font-weight="bold" text-anchor="middle">${num}</text>
      </svg>
    `;
    cell.onclick = () => toggleSelectiveSlot(i);
    container.appendChild(cell);
  }

  for (let i = 1; i <= 45; i++) createSelectableSlot(i, gridTop);
  for (let i = 46; i <= 90; i++) createSelectableSlot(i, gridBottom);

  updateSelectiveUI();
}

function toggleSelectiveSlot(i) {
  if (selectiveOpenSlots.has(i)) {
    selectiveOpenSlots.delete(i);
  } else {
    selectiveOpenSlots.add(i);
  }
  const btn = document.getElementById('sel-slot-' + i);
  if (btn) {
    const selBg = btn.querySelector('.sel-bg');
    const selBox = btn.querySelector('.sel-box');

    if (selectiveOpenSlots.has(i)) {
      btn.style.transform = 'scale(1.05)';
      if (selBg) {
        selBg.setAttribute('fill', '#fee2e2'); // 연한 적색 배경
        selBg.setAttribute('stroke', '#d1d5db'); // 기본 테두리 유지
        selBg.setAttribute('stroke-width', '2');
      }
      if (selBox) {
        selBox.setAttribute('fill', '#ef4444'); // 적색 내부 박스
      }
    } else {
      btn.style.transform = 'scale(1)';
      if (selBg) {
        selBg.setAttribute('fill', '#f4f5f7');
        selBg.setAttribute('stroke', '#d1d5db');
        selBg.setAttribute('stroke-width', '2');
      }
      if (selBox) {
        selBox.setAttribute('fill', '#767171');
      }
    }
  }
  updateSelectiveUI();
}

function updateSelectiveUI() {
  const countEl = document.getElementById('selective-open-count');
  const execBtn = document.getElementById('btn-selective-open-execute');
  const count = selectiveOpenSlots.size;
  if (countEl) countEl.textContent = count;
  if (execBtn) {
    if (count > 0) {
      execBtn.style.opacity = '1';
      execBtn.style.pointerEvents = 'auto';
    } else {
      execBtn.style.opacity = '0.5';
      execBtn.style.pointerEvents = 'none';
    }
  }
}

function executeSelectiveOpen() {
  if (selectiveOpenSlots.size === 0) return;

  const sorted = Array.from(selectiveOpenSlots).sort((a, b) => a - b);
  const slotNums = sorted.map(n => '#' + String(n).padStart(2, '0'));

  const slotsEl = document.getElementById('selective-complete-slots');
  if (slotsEl) slotsEl.textContent = slotNums.join(', ');

  const msgEl = document.getElementById('selective-complete-msg');
  if (msgEl) msgEl.innerHTML = `선택된 ${sorted.length}개 슬롯이 개방되었습니다.<br>관련 데이터가 시스템에 안전하게 기록되었습니다.`;

  goScreen('emergency-selective-complete');
}

// Hook: rebuild selective grid when navigating to the screen
const _originalGoScreen = goScreen;
goScreen = function(name) {
  _originalGoScreen(name);
  if (name === 'emergency-selective-open') {
    buildSelectiveGrid();
  }
};
