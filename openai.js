export async function getInterpretation(card) {
    const apiKey = localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('ASPI_API_KEY');
    if (!apiKey) {
        return 'No API key found. Please save your OpenAI key to enable interpretations.';
    }

    const prompt = `Provide a short tarot interpretation for the card ${card.name} (traditional: ${card.traditional}).`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 60
            })
        });
        const data = await res.json();
        return data.choices[0].message.content.trim();
    } catch (e) {
        console.error(e);
        return 'Failed to fetch interpretation.';
    }
}

export async function getReadingInterpretation(past, present, future) {
    const apiKey = localStorage.getItem('OPENAI_API_KEY') || localStorage.getItem('ASPI_API_KEY');
    if (!apiKey) {
        return 'No API key found. Please save your OpenAI key to enable interpretations.';
    }

    const prompt = `give a fortune teller style interpretation of this tarot card reading: Past: ${past.traditional}, Present: ${present.traditional}, Future: ${future.traditional}`;

    try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 120
            })
        });
        const data = await res.json();
        return data.choices[0].message.content.trim();
    } catch (e) {
        console.error(e);
        return 'Failed to fetch interpretation.';
    }
}
