// main.js — boot, preloader gate, the reading itself, and the render loop.

import { createGL } from './js/gl.js';
import { createSoundscape } from './js/soundscape.js';
import { createCursor } from './js/cursor.js';
import { createExperience } from './js/experience.js';

const exp = createExperience();
const state = exp.state;
const gl = state.reduced ? null : createGL();
const sound = createSoundscape();
const cursor = createCursor();

const thumb = (file) => 'assets/images/cards/thumbs/' + file.replace(/\.png$/i, '.jpg');
const full = (file) => 'assets/images/cards/' + file;

/* ============================================================
   Preloader / entry veil
   ============================================================ */

const veil = document.getElementById('veil');
const veilBar = document.getElementById('veilBar');
const veilPct = document.getElementById('veilPct');
const veilActions = document.getElementById('veilActions');

const FAN_THUMBS = [
    'starcaller.jpg', 'moonwake.jpg', 'the sky drum.jpg', 'suspended path.jpg', 'the weaver.jpg'
].map(f => 'assets/images/cards/thumbs/' + f);

const PRELOAD_IMAGES = [...FAN_THUMBS, 'assets/images/mat-md.jpg'];
const TOTAL_ITEMS = 1 /* fonts */ + PRELOAD_IMAGES.length + 4 /* audio */;
let loadedItems = 0;
let veilReady = false;

function itemLoaded() {
    loadedItems = Math.min(TOTAL_ITEMS, loadedItems + 1);
    const p = loadedItems / TOTAL_ITEMS;
    veilBar.style.transform = `scaleX(${p})`;
    veilPct.textContent = Math.round(p * 100);
    if (loadedItems >= TOTAL_ITEMS) showActions();
}

function showActions() {
    if (veilReady) return;
    veilReady = true;
    veilPct.textContent = '100';
    veilBar.style.transform = 'scaleX(1)';
    veilActions.hidden = false;
}

for (const src of PRELOAD_IMAGES) {
    const img = new Image();
    img.onload = itemLoaded;
    img.onerror = itemLoaded;
    img.src = src;
}

Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise(r => setTimeout(r, 4000))
]).then(itemLoaded);

sound.preload(itemLoaded);

// failsafe: never trap anyone behind the veil
setTimeout(showActions, 9000);

function enter(withSound) {
    sound.start(!withSound);
    setToggleUI(withSound);
    document.body.classList.add('entered');
    document.body.dataset.entered = 'true';
    veil.classList.add('gone');
    setTimeout(() => veil.remove(), 1100);
    exp.measureParallax();
}

document.getElementById('enterSound').addEventListener('click', () => enter(true));
document.getElementById('enterSilent').addEventListener('click', () => enter(false));

/* ============================================================
   Sound toggle
   ============================================================ */

const soundToggle = document.getElementById('soundToggle');

function setToggleUI(on) {
    soundToggle.classList.toggle('on', on);
    soundToggle.setAttribute('aria-pressed', String(on));
}

soundToggle.addEventListener('click', () => {
    const nowOn = !soundToggle.classList.contains('on');
    if (nowOn && !sound.running) sound.start(false);
    else sound.setMuted(!nowOn);
    setToggleUI(nowOn);
});

/* ============================================================
   Navigation niceties
   ============================================================ */

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);

document.getElementById('brandLink').addEventListener('click', (e) => {
    e.preventDefault();
    scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById('beginBtn').addEventListener('click', () => {
    document.getElementById('reading').scrollIntoView({ behavior: 'smooth' });
});

/* ============================================================
   GL planes for the always-present imagery
   ============================================================ */

if (gl) {
    document.querySelectorAll('.fan-card').forEach(img => gl.addPlane(img, img.src, { flex: 1.1 }));
    const mat = document.getElementById('matImg');
    gl.addPlane(mat, mat.src, { flex: 0.35, opacity: 0.34 });
    const plaque = document.getElementById('plaque');
    gl.addPlane(plaque, plaque.src, { flex: 0.8 });
}

/* ============================================================
   Card data + the reading
   ============================================================ */

let cards = [];
let interpretations = [];
const cardsByFile = {};

let drawCount = 0;
let shuffledDeck = [];

const POSITIONS = ['Past', 'Present', 'Future'];
const ORDINALS = ['first', 'second', 'third'];
const slots = [...document.querySelectorAll('#threeCardContainer .slot')];
const drawBtn = document.getElementById('drawBtn');
const statusEl = document.getElementById('readingStatus');

const STATUS_LINES = [
    'The deck is shuffled and waiting.',
    'The past is on the table. Two remain.',
    'The present stands beside it. One remains.',
    'The spread is complete. Sit with it a while.'
];

async function loadData() {
    try {
        const [cardsRes, interpRes] = await Promise.all([
            fetch('assets/cards.json'),
            fetch('assets/interpretations.json')
        ]);
        if (!cardsRes.ok || !interpRes.ok) throw new Error('HTTP error loading card data');
        cards = await cardsRes.json();
        interpretations = await interpRes.json();
        if (!cards.length || !interpretations.length) throw new Error('Card data is empty');
        for (const c of cards) cardsByFile[c.image] = c.name;
        exp.buildMarquee(cardsByFile, gl);
        wireMarqueeClicks();
        beginNewSpread();
    } catch (err) {
        console.error('Could not load card data:', err);
        statusEl.textContent = 'The cards could not be reached. Refresh and try again.';
        drawBtn.disabled = true;
    }
}

function beginNewSpread() {
    shuffledDeck = [...cards].sort(() => 0.5 - Math.random());
    drawCount = 0;
    refreshControls();
}

function refreshControls() {
    slots.forEach((slot, i) => slot.classList.toggle('armed', i === drawCount));
    statusEl.textContent = STATUS_LINES[drawCount];
    drawBtn.textContent = drawCount < 3 ? `Turn the ${ORDINALS[drawCount]} card` : 'Shuffle the deck';
    drawBtn.dataset.cursor = drawCount < 3 ? 'turn' : 'shuffle';
}

function findInterpretation(cardName, position) {
    const key = `${cardName} - ${position}`;
    const found = interpretations.find(item => item.key === key);
    return found ? found.value : 'The ancestors are quiet on this one. Trust what the image stirs in you.';
}

function revealNext() {
    if (drawCount >= 3) { resetReading(); return; }

    const i = drawCount;
    const slot = slots[i];
    const card = shuffledDeck[i];
    const position = POSITIONS[i];
    const img = slot.querySelector('.card-img');
    const nameEl = slot.querySelector('.card-name');
    const interpEl = slot.querySelector('.interpretation');

    sound.playCard();
    slot.classList.add('revealed');

    img.alt = card.name;
    img.dataset.full = full(card.image);
    img.dataset.name = card.name;
    img.dataset.position = position;
    img.setAttribute('data-cursor', 'view');
    img.onload = () => {
        img.classList.add('shown');
        if (gl) {
            gl.addPlane(img, img.src, { flex: 0.9, onReady: () => gl.burst(img) });
        } else {
            img.classList.add('burst-css');
            setTimeout(() => img.classList.remove('burst-css'), 1600);
        }
    };
    img.src = thumb(card.image);

    nameEl.textContent = card.name;
    exp.splitChars(nameEl);
    requestAnimationFrame(() => requestAnimationFrame(() => nameEl.classList.add('in')));

    interpEl.textContent = findInterpretation(card.name, position);
    exp.splitWords(interpEl);
    setTimeout(() => interpEl.classList.add('in'), 550);

    drawCount++;
    refreshControls();
}

function resetReading() {
    for (const slot of slots) {
        const img = slot.querySelector('.card-img');
        const nameEl = slot.querySelector('.card-name');
        const interpEl = slot.querySelector('.interpretation');
        slot.classList.remove('revealed', 'pulse');
        if (gl) gl.removePlane(img);
        img.classList.remove('shown', 'burst-css');
        img.onload = null;
        img.removeAttribute('src');
        img.removeAttribute('data-cursor');
        nameEl.classList.remove('in');
        nameEl.textContent = '';
        interpEl.classList.remove('in');
        interpEl.textContent = '';
    }
    beginNewSpread();
}

drawBtn.addEventListener('click', revealNext);

slots.forEach((slot, i) => {
    slot.querySelector('.card-back').addEventListener('click', () => {
        if (i === drawCount) {
            revealNext();
        } else if (!slot.classList.contains('revealed')) {
            const armed = slots[drawCount];
            if (armed) {
                armed.classList.remove('pulse');
                void armed.offsetWidth;
                armed.classList.add('pulse');
            }
        }
    });
    slot.querySelector('.card-img').addEventListener('click', (e) => {
        const img = e.currentTarget;
        if (img.dataset.full) openModal(img.dataset.full, img.src, `${img.dataset.name} · ${img.dataset.position}`);
    });
});

/* ============================================================
   Marquee clicks open the card in the modal
   ============================================================ */

function wireMarqueeClicks() {
    document.getElementById('marquee').addEventListener('click', (e) => {
        const img = e.target.closest('img[data-file]');
        if (!img) return;
        if (gl) gl.burst(img);
        openModal(full(img.dataset.file), img.src, cardsByFile[img.dataset.file] || '');
    });
}

/* ============================================================
   Modal
   ============================================================ */

const imageModal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const modalCaption = document.getElementById('modalCaption');
const modalClose = document.getElementById('modalClose');

function openModal(fullSrc, previewSrc, caption) {
    modalImage.src = previewSrc || fullSrc;
    modalCaption.textContent = caption;
    imageModal.classList.add('visible');
    if (previewSrc && fullSrc !== previewSrc) {
        const hi = new Image();
        hi.onload = () => {
            if (imageModal.classList.contains('visible')) modalImage.src = fullSrc;
        };
        hi.src = fullSrc;
    }
}

function closeModal() {
    imageModal.classList.remove('visible');
}

modalClose.addEventListener('click', closeModal);
imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) closeModal();
});
addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

/* ============================================================
   Render loop
   ============================================================ */

let lastT = performance.now();

function step(now) {
    const t = now / 1000;
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0.016;
    lastT = now;

    exp.update(t, dt);
    if (gl) gl.render(state, t, dt);
    sound.setWeights(state.zones);
    sound.tick(dt);
    cursor.tick(dt, state);
}

function frame(now) {
    step(now);
    requestAnimationFrame(frame);
}

requestAnimationFrame(frame);

// manual frame stepping for local debugging (rAF pauses in hidden tabs)
if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    window.__step = step;
    window.__state = state;
}
loadData();
