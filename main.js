document.addEventListener('DOMContentLoaded', () => {
    // Correctly match the IDs from your index.html file
    const drawButton = document.getElementById('drawCards');
    const pastCardImg = document.getElementById('pastImage');
    const presentCardImg = document.getElementById('presentImage');
    const futureCardImg = document.getElementById('futureImage');
    const pastInterpretationEl = document.getElementById('pastInterpretation');
    const presentInterpretationEl = document.getElementById('presentInterpretation');
    const futureInterpretationEl = document.getElementById('futureInterpretation');
    const threeCardContainer = document.getElementById('threeCardContainer');

    let cards = [];
    let interpretations = [];

    // Fetch card names and interpretations from your assets folder
    async function loadData() {
        try {
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) throw new Error(`Failed to fetch cards.json: ${cardsResponse.status}`);
            const cardsData = await cardsResponse.json();
            // Store the full card objects
            cards = cardsData.cards;

            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) throw new Error(`Failed to fetch interpretations.json: ${interpretationsResponse.status}`);
            interpretations = await interpretationsResponse.json();

            drawButton.disabled = false; // Enable the button now that data is loaded
            console.log("Card and interpretation data loaded successfully.");

        } catch (error) {
            console.error("Failed to load initial data:", error);
            presentInterpretationEl.textContent = "Could not load card data. Please check file paths and JSON format.";
        }
    }

    function drawAndDisplayCards() {
        if (cards.length === 0 || interpretations.length === 0) {
            console.error("Data not loaded, cannot draw cards.");
            return;
        }
        
        threeCardContainer.classList.remove('hidden');

        // Shuffle and pick 3 unique cards
        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        const pastCard = shuffledCards[0];
        const presentCard = shuffledCards[1];
        const futureCard = shuffledCards[2];

        // Display each card and its interpretation
        displayCard('Past', pastCard, pastCardImg, pastInterpretationEl);
        displayCard('Present', presentCard, presentCardImg, presentInterpretationEl);
        displayCard('Future', futureCard, futureCardImg, futureInterpretationEl);
    }

    function displayCard(position, card, imgElement, interpretationElement) {
        // *** THIS IS THE CORRECTED PART ***
        // Create the image name from the card name property, in lowercase.
        // e.g., "ACE OF AIR" -> "ace of air"
        const imageName = card.name.toLowerCase();
        imgElement.src = `assets/images/cards/${imageName}.png`;
        imgElement.alt = card.name;

        // Find and display the correct interpretation (using the original uppercase name)
        const interpretationKey = `${card.name} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);

        if (foundInterpretation) {
            interpretationElement.textContent = foundInterpretation.value;
        } else {
            interpretationElement.textContent = `Interpretation for "${interpretationKey}" not found.`;
        }
    }

    // --- Initialize the App ---
    drawButton.addEventListener('click', drawAndDisplayCards);
    drawButton.disabled = true; // Button is disabled until data is loaded
    loadData();
});
