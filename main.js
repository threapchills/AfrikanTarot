import { getInterpretation } from './openai.js';

async function loadCards() {
    const res = await fetch('assets/cards.json');
    return res.json();
}

function playSound(url) {
    const audio = document.getElementById('cardSound');
    const fallback = 'assets/sounds/uHadi (Percussion).mp3';
    audio.volume = 0.25;
    if (!url) {
        url = fallback;
    }
    audio.src = url;
    audio.play();
}

function showModal(src) {
    const modal = document.getElementById('imageModal');
    const img = document.getElementById('modalImage');
    img.src = src;
    modal.classList.remove('hidden');
}

function hideModal() {
    document.getElementById('imageModal').classList.add('hidden');
}

function resetSlots() {
    const container = document.getElementById('threeCardContainer');
    container.classList.remove('with-background');
    container.style.backgroundImage = '';
    ['past', 'present', 'future'].forEach(slot => {
        const img = document.getElementById(`${slot}Image`);
        img.src = '';
        img.className = '';
        img.onclick = null;
        document.getElementById(`${slot}Name`).textContent = '';
        const interp = document.getElementById(`${slot}Interpretation`);
        if (interp) interp.textContent = '';
    });
}

async function displaySlot(slot, card) {
    const container = document.getElementById('threeCardContainer');
    const imgEl = document.getElementById(`${slot}Image`);
    imgEl.src = card.image;
    imgEl.classList.add('drawn');
    imgEl.onclick = () => showModal(card.image);
    document.getElementById(`${slot}Name`).textContent = card.name;
    playSound(card.sound);

    const interpretation = await getInterpretation(card);
    const interpEl = document.getElementById(`${slot}Interpretation`);
    if (interpEl) {
        interpEl.textContent = interpretation;
    }

    if (slot === 'present') {
        imgEl.classList.add('center');
        container.style.backgroundImage = `url('${card.image}')`;
        container.classList.add('with-background');
    }

    container.classList.remove('hidden');
}

async function drawCards(cards) {
    resetSlots();
    const used = new Set();
    const drawn = [];
    while (drawn.length < 3) {
        const idx = Math.floor(Math.random() * cards.length);
        if (!used.has(idx)) {
            used.add(idx);
            drawn.push(cards[idx]);
        }
    }
    await Promise.all([
        displaySlot('past', drawn[0]),
        displaySlot('present', drawn[1]),
        displaySlot('future', drawn[2])
    ]);
}

window.addEventListener('DOMContentLoaded', async () => {
    const apiKeyContainer = document.getElementById('apiKeyContainer');
    const saveKeyBtn = document.getElementById('saveApiKey');
    const apiKeyInput = document.getElementById('apiKeyInput');

    if (!localStorage.getItem('OPENAI_API_KEY')) {
        apiKeyContainer.classList.remove('hidden');
    }

    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('OPENAI_API_KEY', key);
            apiKeyContainer.classList.add('hidden');
        }
    });

    const cards = await loadCards();
    document.getElementById('drawCards').addEventListener('click', () => drawCards(cards));
    document.getElementById('modalClose').addEventListener('click', hideModal);
    document.getElementById('imageModal').addEventListener('click', (e) => {
        if (e.target.id === 'imageModal') hideModal();
    });
});
