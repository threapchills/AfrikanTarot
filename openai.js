export async function getInterpretation(card) {
    try {
        const res = await fetch('/api/interpretation', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ card })
        });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        return data.interpretation;
    } catch (e) {
        console.error(e);
        return 'Failed to fetch interpretation.';
    }
}

export async function getReadingInterpretation(past, present, future) {
    try {
        const res = await fetch('/api/reading', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ past, present, future })
        });
        if (!res.ok) throw new Error('Request failed');
        const data = await res.json();
        return data.interpretation;
    } catch (e) {
        console.error(e);
        return 'Failed to fetch interpretation.';
    }
}
