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

    // **NEW**: Get references to the card name elements
    const pastNameEl = document.getElementById('pastName');
    const presentNameEl = document.getElementById('presentName');
    const futureNameEl = document.getElementById('futureName');

    let cards = [];
    let interpretations = [];

    // This function runs once when the page loads to fetch our data
    async function loadData() {
        try {
            const cardsResponse = await fetch('assets/cards.json');
            if (!cardsResponse.ok) throw new Error(`HTTP error! Status: ${cardsResponse.status}. Failed to load cards.json.`);
            cards = await cardsResponse.json();
            console.log("Successfully fetched cards.json. Cards loaded:", cards.length);

            const interpretationsResponse = await fetch('assets/interpretations.json');
            if (!interpretationsResponse.ok) throw new Error(`HTTP error! Status: ${interpretationsResponse.status}. Failed to load interpretations.json.`);
            interpretations = await interpretationsResponse.json();
            console.log("Successfully fetched interpretations.json. Interpretations loaded:", interpretations.length);

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

        threeCardContainer.classList.remove('hidden');

        const shuffledCards = [...cards].sort(() => 0.5 - Math.random());
        const pastCard = shuffledCards[0];
        const presentCard = shuffledCards[1];
        const futureCard = shuffledCards[2];

        // **UPDATED**: Pass the new name elements to the display function
        displayCard('Past', pastCard, pastCardImg, pastNameEl, pastInterpretationEl);
        displayCard('Present', presentCard, presentCardImg, presentNameEl, presentInterpretationEl);
        displayCard('Future', futureCard, futureCardImg, futureNameEl, futureInterpretationEl);
    }

    // This helper function handles the logic for a single card slot
    function displayCard(position, card, imgElement, nameElement, interpretationElement) {
        // Set the image source directly from the 'image' property in cards.json
        imgElement.src = `assets/images/cards/${card.image}`;
        imgElement.alt = card.name;

        // **NEW**: Set the text content of the card name element
        nameElement.textContent = card.name;

        // Find the matching interpretation
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
