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

    // **FIX**: Initialize as empty arrays to prevent the "length" error
    let cards = [];
    let interpretations = [];

    // This function runs once when the page loads to fetch our data
    async function loadData() {
        try {
            // Fetch the list of card names and images
            console.log("Attempting to fetch assets/cards.json...");
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) {
                // If the file isn't found, throw a specific error
                throw new Error(`HTTP error! status: ${cardsResponse.status}. Failed to load cards.json. Check the file path.`);
            }
            const cardsData = await cardsResponse.json();
            cards = cardsData.cards; // Assign the loaded data
            console.log("Successfully fetched cards.json.", cards);

            // Fetch the interpretations for each card
            console.log("Attempting to fetch assets/interpretations.json...");
            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) {
                // If the file isn't found, throw a specific error
                throw new Error(`HTTP error! status: ${interpretationsResponse.status}. Failed to load interpretations.json. Check the file path.`);
            }
            interpretations = await interpretationsResponse.json();
            console.log("Successfully fetched interpretations.json.", interpretations);

            // If everything loaded correctly, enable the button
            drawButton.disabled = false;
            console.log("Data loaded successfully. Draw button enabled.");

        } catch (error) {
            // If anything goes wrong, log the detailed error and update the UI
            console.error("CRITICAL ERROR LOADING DATA:", error);
            presentInterpretationEl.textContent = "Error: Could not load card data. Please check the console (F12) for more details.";
        }
    }

    // This function runs when the "Draw Cards" button is clicked
    function drawAndDisplayCards() {
        // This check is now safe because 'cards' is an array
        if (cards.length === 0) {
            console.error("Cannot draw cards because card data is empty.");
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
        // Create the image filename (e.g., "ACE OF AIR" -> "ace of air.png")
        const imageName = card.name.toLowerCase();
        imgElement.src = `assets/images/cards/${imageName}.png`;
        imgElement.alt = card.name;

        // Find the matching interpretation (e.g., "ACE OF AIR - Past")
        const interpretationKey = `${card.name} - ${position}`;
        const foundInterpretation = interpretations.find(item => item.key === interpretationKey);

        if (foundInterpretation) {
            interpretationElement.textContent = foundInterpretation.value;
        } else {
            interpretationElement.textContent = `Interpretation for "${interpretationKey}" not found.`;
        }
    }

    // --- Initialize the App ---
    // Add the click listener to the button
    drawButton.addEventListener('click', drawAndDisplayCards);
    // Keep the button disabled until data is loaded
    drawButton.disabled = true;
    // Start loading the data
    loadData();
});
