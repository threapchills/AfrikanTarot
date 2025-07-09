document.addEventListener('DOMContentLoaded', () => {
    // Get references to all the HTML elements
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

    // Load the data from your JSON files
    async function loadData() {
        try {
            // Fetch cards.json. The file is an array at its root.
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) throw new Error(`Failed to fetch cards.json`);
            cards = await cardsResponse.json(); // The response IS the array of cards
            console.log("Successfully fetched cards.json. Cards loaded:", cards.length);

            // Fetch the interpretations
            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) throw new Error(`Failed to fetch interpretations.json`);
            interpretations = await interpretationsResponse.json();
            console.log("Successfully fetched interpretations.json. Interpretations loaded:", interpretations.length);

            // Enable the button only if both files load successfully
            if (cards.length > 0 && interpretations.length > 0) {
                drawButton.disabled = false;
                console.log("Data loaded. Draw button enabled.");
            } else {
                throw new Error("Data loaded, but one of the files is empty.");
            }

        } catch (error) {
            console.error("CRITICAL ERROR LOADING DATA:", error);
            presentInterpretationEl.textContent = "Error: Could not load card data. Please check file paths and ensure JSON files are not empty.";
        }
    }

    // This runs when the "Draw Cards" button is clicked
    function drawAndDisplayCards() {
        if (cards.length === 0) {
            console.error("Cannot draw because card data is not loaded.");
            return;
        }

        threeCardContainer.classList.remove('hidden');

        // Shuffle the deck and pick three cards
        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        const pastCard = shuffledCards[0];
        const presentCard = shuffledCards[1];
        const futureCard = shuffledCards[2];

        // Display each card
        displayCard('Past', pastCard, pastCardImg, pastInterpretationEl);
        displayCard('Present', presentCard, presentCardImg, presentInterpretationEl);
        displayCard('Future', futureCard, futureCardImg, futureInterpretationEl);
    }

    // This function puts the card info on the screen
    function displayCard(position, card, imgElement, interpretationElement) {
        // **THE FIX**: Use the `image` and `name` properties directly from your `cards.json`
        imgElement.src = card.image; // Use the full image path from the file
        imgElement.alt = card.name;  // Use the name from the file

        // Find the matching interpretation (e.g., "Ace Of Air - Past")
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
    drawButton.disabled = true; // Button starts disabled
    loadData(); // Load data when the page opens
});
