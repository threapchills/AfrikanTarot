document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the HTML elements we need to interact with
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

    // This function runs once when the page loads to fetch our data
    async function loadData() {
        try {
            // Fetch the list of cards
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) {
                throw new Error(`HTTP error! Status: ${cardsResponse.status}. Failed to load cards.json.`);
            }
            cards = await cardsResponse.json();
            console.log("Successfully fetched cards.json. Cards loaded:", cards.length);

            // Fetch the interpretations
            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) {
                throw new Error(`HTTP error! Status: ${interpretationsResponse.status}. Failed to load interpretations.json.`);
            }
            interpretations = await interpretationsResponse.json();
            console.log("Successfully fetched interpretations.json. Interpretations loaded:", interpretations.length);

            // Enable the button only if both files load successfully
            if (cards.length > 0 && interpretations.length > 0) {
                drawButton.disabled = false;
                console.log("Data loaded successfully. Draw button enabled.");
            } else {
                throw new Error("Data loaded, but one of the data files is empty.");
            }

        } catch (error) {
            console.error("CRITICAL ERROR LOADING DATA:", error);
            presentInterpretationEl.textContent = "Error: Could not load card data. Please check the browser console (F12) for details.";
        }
    }

    // This function runs when the "Draw Cards" button is clicked
    function drawAndDisplayCards() {
        if (cards.length === 0) {
            console.error("Cannot draw cards because card data is not loaded.");
            return;
        }

        // Make the card display area visible
        threeCardContainer.classList.remove('hidden');

        // Shuffle the deck and pick the top three cards
        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        const pastCard = shuffledCards[0];
        const presentCard = shuffledCards[1];
        const futureCard = shuffledCards[2];

        // Display each card and find its interpretation
        displayCard('Past', pastCard, pastCardImg, pastInterpretationEl);
        displayCard('Present', presentCard, presentCardImg, presentInterpretationEl);
        displayCard('Future', futureCard, futureCardImg, futureInterpretationEl);
    }

    // This helper function handles the logic for a single card slot
    function displayCard(position, card, imgElement, interpretationElement) {
        // **THE FIX**: This now directly uses the 'image' field from your cards.json.
        // All the complex name-guessing logic has been removed.
        imgElement.src = `assets/images/cards/${card.image}`;
        imgElement.alt = card.name;

        // Find the matching interpretation (this still uses the full name, e.g., "The Magician - Past")
        const interpretationKey = `${card.name} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);

        if (foundInterpretation) {
            interpretationElement.textContent = foundInterpretation.value;
        } else {
            interpretationElement.textContent = `Interpretation for "${interpretationKey}" not found.`;
            console.warn(`Missing interpretation for key: ${interpretationKey}`);
        }
    }

    // --- Initialize the App ---
    drawButton.addEventListener('click', drawAndDisplayCards);
    drawButton.disabled = true; // Button starts disabled
    loadData(); // Load data when the page opens
});
