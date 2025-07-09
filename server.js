import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const majorVersion = parseInt(process.versions.node.split('.')[0], 10);
if (majorVersion < 18) {
    console.warn(`Warning: Node.js 18 or later is recommended. Current version: ${process.version}`);
}

const app = express();
const PORT = process.env.PORT || 3000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean);

app.use(express.json());
if (ALLOWED_ORIGINS && ALLOWED_ORIGINS.length > 0) {
    app.use(cors({ origin: ALLOWED_ORIGINS }));
} else {
    app.use(cors());
}
app.use(express.static(__dirname));

async function callOpenAI(prompt, max_tokens) {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'user', content: prompt }],
            max_tokens
        })
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No interpretation.';
}

app.post('/api/interpretation', async (req, res) => {
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured.' });
    }
    const { card } = req.body;
    const prompt = `Provide a short tarot interpretation for the card ${card.name} (traditional: ${card.traditional}).`;
    try {
        const text = await callOpenAI(prompt, 60);
        res.json({ interpretation: text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch interpretation.' });
    }
});

app.post('/api/reading', async (req, res) => {
    if (!OPENAI_API_KEY) {
        return res.status(500).json({ error: 'API key not configured.' });
    }
    const { past, present, future } = req.body;
    const prompt = `give a fortune teller style interpretation of this tarot card reading: Past: ${past.traditional}, Present: ${present.traditional}, Future: ${future.traditional}`;
    try {
        const text = await callOpenAI(prompt, 120);
        res.json({ interpretation: text });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to fetch interpretation.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
