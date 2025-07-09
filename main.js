import { getInterpretation } from './openai.js';

async function loadCards() {
    const res = await fetch('assets/cards.json');
    return res.json();
}

function playSound(url) {
    const audio = document.getElementById('cardSound');
    audio.src = url;
    audio.play();
}

function displayCard(card) {
    const container = document.getElementById('cardContainer');
    document.getElementById('cardImage').src = card.image;
    document.getElementById('cardName').textContent = card.name;
    playSound(card.sound);
    container.classList.remove('hidden');
}

async function drawCard(cards) {
    const card = cards[Math.floor(Math.random() * cards.length)];
    displayCard(card);
    const interpretation = await getInterpretation(card);
    document.getElementById('interpretation').textContent = interpretation;
}

window.addEventListener('DOMContentLoaded', async () => {
    const cards = await loadCards();
    document.getElementById('drawCard').addEventListener('click', () => drawCard(cards));
});
