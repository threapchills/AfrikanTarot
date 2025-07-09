document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all HTML elements ---
    const drawButton = document.getElementById('drawCards');
    const threeCardContainer = document.getElementById('threeCardContainer');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');
    const cardSound = document.getElementById('cardSound');

    // Grouping elements for easier access
    const slots = {
        past: {
            img: document.getElementById('pastImage'),
            name: document.getElementById('pastName'),
            interp: document.getElementById('pastInterpretation')
        },
        present: {
            img: document.getElementById('presentImage'),
            name: document.getElementById('presentName'),
            interp: document.getElementById('presentInterpretation')
        },
        future: {
            img: document.getElementById('futureImage'),
            name: document.getElementById('futureName'),
            interp: document.getElementById('futureInterpretation')
        }
    };

    let cards = [];
    let interpretations = [];
    
    // **NEW**: State management variables
    let drawCount = 0;
    let shuffledDeck = [];

    // --- Load Data ---
    async function loadData() {
        try {
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) throw new Error(`HTTP error loading cards.json`);
            cards = await cardsResponse.json();

            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) throw new Error(`HTTP error loading interpretations.json`);
            interpretations = await interpretationsResponse.json();

            if (cards.length > 0 && interpretations.length > 0) {
                drawButton.disabled = false;
            } else {
                throw new Error("Data files are empty.");
            }
        } catch (error) {
            console.error("CRITICAL ERROR LOADING DATA:", error);
            presentInterpretationEl.textContent = "Error: Could not load card data.";
        }
    }

    // --- Main button click handler ---
    function handleDrawClick() {
        if (cardSound) {
            cardSound.currentTime = 0;
            cardSound.play();
        }

        threeCardContainer.classList.remove('hidden');

        if (drawCount === 0) { // First draw
            shuffledDeck = [...cards].sort(() => 0.5 - Math.random());
            displayCard('Past', shuffledDeck[0], slots.past);
            drawCount++;
        } else if (drawCount === 1) { // Second draw
            displayCard('Present', shuffledDeck[1], slots.present);
            drawCount++;
        } else if (drawCount === 2) { // Third draw
            displayCard('Future', shuffledDeck[2], slots.future);
            drawButton.textContent = "Shuffle Deck";
            drawCount++;
        } else { // Reset
            resetReading();
        }
    }

    // --- Display a Single Card ---
    function displayCard(position, card, slotElements) {
        const imagePath = `assets/images/cards/${card.image}`;
        slotElements.img.src = imagePath;
        slotElements.img.alt = card.name;
        slotElements.name.textContent = card.name;
        
        slotElements.img.onclick = () => openModal(imagePath);

        const interpretationKey = `${card.name} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);
        slotElements.interp.textContent = foundInterpretation ? foundInterpretation.value : `Interpretation for "${interpretationKey}" not found.`;
    }

    // **NEW**: Function to reset the board
    function resetReading() {
        const placeholderImg = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
        
        // Clear all slots
        for (const position in slots) {
            slots[position].img.src = placeholderImg;
            slots[position].img.alt = position;
            slots[position].img.onclick = null; // Remove click listener
            slots[position].name.textContent = "";
            slots[position].interp.textContent = "";
        }

        threeCardContainer.classList.add('hidden');
        drawButton.textContent = "Draw Card";
        drawCount = 0;
        shuffledDeck = [];
    }

    // --- Image Modal Controls ---
    function openModal(imageSrc) {
        modalImage.src = imageSrc;
        imageModal.classList.add('visible');
    }

    function closeModal() {
        imageModal.classList.remove('visible');
    }

    // --- Initialize App and Event Listeners ---
    drawButton.addEventListener('click', handleDrawClick);
    modalClose.addEventListener('click', closeModal);
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    drawButton.disabled = true;
    loadData();
});
