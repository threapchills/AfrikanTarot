import { getInterpretation } from './openai.js';

async function loadCards() {
    const res = await fetch('assets/cards.json');
    return res.json();
}

function playSound(url) {
    const audio = document.getElementById('cardSound');
    const fallback = [
        'assets/sounds/uHadi (Guitar).mp3',
        'assets/sounds/uHadi (Percussion).mp3',
        'assets/sounds/noita1.mp3'
    ];
    audio.volume = 0.25;
    if (!url) {
        url = fallback[Math.floor(Math.random() * fallback.length)];
    }
    audio.src = url;
    audio.play();
}

function resetSlots() {
    const container = document.getElementById('threeCardContainer');
    container.classList.remove('with-background');
    container.style.backgroundImage = '';
    ['past', 'present', 'future'].forEach(slot => {
        const img = document.getElementById(`${slot}Image`);
        img.src = '';
        img.className = '';
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
    const cards = await loadCards();
    document.getElementById('drawCards').addEventListener('click', () => drawCards(cards));
});
