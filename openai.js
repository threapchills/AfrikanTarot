export function promptForApiKey() {
    let key = localStorage.getItem('OPENAI_API_KEY');
    if (!key) {
        key = prompt('Enter your OpenAI API key:');
        if (key) {
            localStorage.setItem('OPENAI_API_KEY', key);
        }
    }
    return key;
}

export async function getInterpretation(card) {
    let apiKey = localStorage.getItem('OPENAI_API_KEY');
    if (!apiKey) {
        apiKey = promptForApiKey();
        if (!apiKey) return '';
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
