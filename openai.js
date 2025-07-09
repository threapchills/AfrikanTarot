export async function getInterpretation(card) {
    const apiKey = localStorage.getItem('OPENAI_API_KEY');
    if (!apiKey) {
        return 'Add your OpenAI API key to localStorage as OPENAI_API_KEY to get interpretations.';
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
                model: 'gpt-3.5-turbo',
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
