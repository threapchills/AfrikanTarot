let API_BASE = '';

if (typeof window !== 'undefined') {
    if (window.API_BASE_URL) {
        API_BASE = window.API_BASE_URL;
    } else {
        const tag = document.querySelector('script[data-api-base]');
        if (tag && tag.dataset.apiBase) {
            API_BASE = tag.dataset.apiBase;
        }
    }
}

function buildUrl(path) {
    if (!API_BASE) return path;
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    return base + path;
}

export async function getInterpretation(cardId, tense) {
    try {
        const res = await fetch(buildUrl('/api/interpretation'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cardId, tense })
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
        const res = await fetch(buildUrl('/api/reading'), {
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
