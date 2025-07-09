document.addEventListener('DOMContentLoaded', () => {
    // --- Get references to all HTML elements ---
    const drawButton = document.getElementById('drawCards');
    const pastCardImg = document.getElementById('pastImage');
    const presentCardImg = document.getElementById('presentImage');
    const futureCardImg = document.getElementById('futureImage');
    const pastInterpretationEl = document.getElementById('pastInterpretation');
    const presentInterpretationEl = document.getElementById('presentInterpretation');
    const futureInterpretationEl = document.getElementById('futureInterpretation');
    const threeCardContainer = document.getElementById('threeCardContainer');
    const pastNameEl = document.getElementById('pastName');
    const presentNameEl = document.getElementById('presentName');
    const futureNameEl = document.getElementById('futureName');
    const imageModal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalClose = document.getElementById('modalClose');
    const cardSound = document.getElementById('cardSound');

    let cards = [];
    let interpretations = [];

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

    // --- Draw and Display Cards ---
    function drawAndDisplayCards() {
        // Play the sound effect
        if (cardSound) {
            cardSound.currentTime = 0;
            // The play() method returns a Promise, which can be useful for debugging
            const playPromise = cardSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.error("Audio playback failed:", error);
                });
            }
        }

        if (cards.length === 0) return;
        threeCardContainer.classList.remove('hidden');

        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        displayCard('Past', shuffledCards[0], pastCardImg, pastNameEl, pastInterpretationEl);
        displayCard('Present', shuffledCards[1], presentCardImg, presentNameEl, presentInterpretationEl);
        displayCard('Future', shuffledCards[2], futureCardImg, futureNameEl, futureInterpretationEl);
    }

    // --- Display a Single Card ---
    function displayCard(position, card, imgElement, nameElement, interpretationElement) {
        const imagePath = `assets/images/cards/${card.image}`;
        imgElement.src = imagePath;
        imgElement.alt = card.name;
        nameElement.textContent = card.name;
        
        imgElement.onclick = () => openModal(imagePath);

        const interpretationKey = `${card.name} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);
        interpretationElement.textContent = foundInterpretation ? foundInterpretation.value : `Interpretation for "${interpretationKey}" not found.`;
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
    drawButton.addEventListener('click', drawAndDisplayCards);
    modalClose.addEventListener('click', closeModal);
    imageModal.addEventListener('click', (e) => {
        if (e.target === imageModal) {
            closeModal();
        }
    });
    
    drawButton.disabled = true;
    loadData();
});
