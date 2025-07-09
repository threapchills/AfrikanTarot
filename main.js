import { getInterpretation } from './openai.js';

async function loadCards() {
    const res = await fetch('assets/cards.json');
    return res.json();
}

function playSound(url) {
    const audio = document.getElementById('cardSound');
    if (!url) return;
    audio.src = url;
    audio.play();
}

async function displaySlot(slot, card) {
    const container = document.getElementById('threeCardContainer');
    document.getElementById(`${slot}Image`).src = card.image;
    document.getElementById(`${slot}Name`).textContent = card.name;
    playSound(card.sound);
    const interpretation = await getInterpretation(card);
    const interpEl = document.getElementById(`${slot}Interpretation`);
    if (interpEl) {
        interpEl.textContent = interpretation;
    }
    container.classList.remove('hidden');
}

async function drawCards(cards) {
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
