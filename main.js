document.addEventListener('DOMContentLoaded', () => {
    const drawButton = document.getElementById('draw-button');
    const pastCardImg = document.getElementById('past-card');
    const presentCardImg = document.getElementById('present-card');
    const futureCardImg = document.getElementById('future-card');
    const pastInterpretationEl = document.getElementById('past-interpretation');
    const presentInterpretationEl = document.getElementById('present-interpretation');
    const futureInterpretationEl = document.getElementById('future-interpretation');

    let cards = [];
    let interpretations = [];

    // Fetch card names and interpretations when the page loads
    async function loadData() {
        try {
            // Use the cards.json file for a structured list of cards
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) throw new Error(`HTTP error! status: ${cardsResponse.status}`);
            const cardsData = await cardsResponse.json();
            cards = cardsData.cards.map(card => card.name); // Assuming cards.json has a "cards" array with "name" properties

            // Fetch the interpretations
            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) throw new Error(`HTTP error! status: ${interpretationsResponse.status}`);
            interpretations = await interpretationsResponse.json();

            drawButton.disabled = false; // Enable the button once data is loaded
            console.log("Card and interpretation data loaded successfully.");

        } catch (error) {
            console.error("Failed to load initial data:", error);
            // Display an error to the user if data fails to load
            presentInterpretationEl.textContent = "Could not load card data. Please refresh the page.";
        }
    }

    function drawAndDisplayCards() {
        if (cards.length === 0 || interpretations.length === 0) {
            console.error("Data not loaded, cannot draw cards.");
            return;
        }

        // --- Clear previous results ---
        pastInterpretationEl.textContent = '...';
        presentInterpretationEl.textContent = '...';
        futureInterpretationEl.textContent = '...';
        
        // --- Shuffle and pick 3 unique cards ---
        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        const pastCardName = shuffledCards[0];
        const presentCardName = shuffledCards[1];
        const futureCardName = shuffledCards[2];

        // --- Display Cards and Interpretations ---
        displayCard('Past', pastCardName, pastCardImg, pastInterpretationEl);
        displayCard('Present', presentCardName, presentCardImg, presentInterpretationEl);
        displayCard('Future', futureCardName, futureCardImg, futureInterpretationEl);
    }

    function displayCard(position, cardName, imgElement, interpretationElement) {
        // 1. Set the card image
        const imageName = cardName.toLowerCase().replace(/\s+/g, '-'); // e.g., "6 of Water" -> "6-of-water"
        imgElement.src = `assets/images/cards/${imageName}.png`; // Assuming .png format
        imgElement.alt = cardName;

        // 2. Find and set the interpretation
        const interpretationKey = `${cardName} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);

        if (foundInterpretation) {
            interpretationElement.textContent = foundInterpretation.value;
        } else {
            interpretationElement.textContent = `Interpretation for "${interpretationKey}" not found.`;
            console.warn(`Could not find interpretation for key: ${interpretationKey}`);
        }
    }

    // --- Initialize the app ---
    drawButton.addEventListener('click', drawAndDisplayCards);
    drawButton.disabled = true; // Disable button until data is loaded
    loadData();
});
