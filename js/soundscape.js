// soundscape.js — Web Audio ambient bed.
// Three elemental drone loops (sky, fire, earth) crossfade as you
// scroll between zones, so the sound descends with you. The card-turn
// one-shot routes through the same master so mute silences everything.

const FILES = {
    sky: 'assets/sounds/sky5',
    fire: 'assets/sounds/fire3',
    earth: 'assets/sounds/earth5'
};

// relative level of each drone once its zone is fully active
const LAYER_LEVEL = { sky: 0.8, fire: 0.95, earth: 0.9 };
const MASTER_LEVEL = 0.55;

export function createSoundscape() {
    // Safari cannot decode ogg vorbis, hence the m4a mirrors
    const probe = document.createElement('audio');
    const ext = probe.canPlayType('audio/ogg; codecs="vorbis"') ? '.ogg' : '.m4a';

    const raw = {};
    let cardRaw = null;
    let ctx = null, master = null, layers = null, cardBuf = null;
    let muted = false, running = false;
    const gains = { sky: 0, fire: 0, earth: 0 };
    let target = { sky: 1, fire: 0, earth: 0 };

    async function preload(onItem) {
        const jobs = Object.entries(FILES).map(async ([k, base]) => {
            try {
                raw[k] = await (await fetch(base + ext)).arrayBuffer();
            } catch (e) { /* ambience degrades silently */ }
            onItem && onItem();
        });
        jobs.push((async () => {
            try {
                cardRaw = await (await fetch('assets/sounds/card.mp3')).arrayBuffer();
            } catch (e) { /* no flip sound */ }
            onItem && onItem();
        })());
        await Promise.allSettled(jobs);
    }

    // must be called from a user gesture so the context may start
    async function start(startMuted) {
        muted = !!startMuted;
        if (running) { setMuted(muted); return; }
        try {
            ctx = new (window.AudioContext || window.webkitAudioContext)();
            if (ctx.state === 'suspended') await ctx.resume();
            master = ctx.createGain();
            master.gain.value = 0;
            master.connect(ctx.destination);
            layers = {};
            for (const k of Object.keys(FILES)) {
                if (!raw[k]) continue;
                const buf = await ctx.decodeAudioData(raw[k].slice(0));
                const g = ctx.createGain();
                g.gain.value = 0;
                g.connect(master);
                const src = ctx.createBufferSource();
                src.buffer = buf;
                src.loop = true;
                // AAC pads the ends with encoder silence; loop inside it
                if (ext === '.m4a') {
                    src.loopStart = 0.08;
                    src.loopEnd = buf.duration - 0.12;
                }
                src.connect(g);
                src.start();
                layers[k] = g;
            }
            if (cardRaw) cardBuf = await ctx.decodeAudioData(cardRaw.slice(0));
            running = true;
            if (!muted) {
                master.gain.setValueAtTime(0, ctx.currentTime);
                master.gain.linearRampToValueAtTime(MASTER_LEVEL, ctx.currentTime + 3);
            }
        } catch (e) {
            console.warn('soundscape unavailable:', e);
        }
    }

    function setWeights(w) { target = w; }

    function tick(dt) {
        if (!running || !layers) return;
        const k = Math.min(1, dt * 1.1);
        for (const key in layers) {
            gains[key] += ((target[key] || 0) - gains[key]) * k;
            layers[key].gain.value = gains[key] * LAYER_LEVEL[key];
        }
    }

    function playCard() {
        if (!running || !cardBuf || muted) return;
        const s = ctx.createBufferSource();
        s.buffer = cardBuf;
        s.playbackRate.value = 0.94 + Math.random() * 0.12;
        const g = ctx.createGain();
        g.gain.value = 0.9;
        s.connect(g);
        g.connect(master);
        s.start();
    }

    function setMuted(m) {
        muted = m;
        if (!running || !master) return;
        const t = ctx.currentTime;
        master.gain.cancelScheduledValues(t);
        master.gain.setValueAtTime(master.gain.value, t);
        master.gain.linearRampToValueAtTime(m ? 0 : MASTER_LEVEL, t + 0.9);
    }

    return {
        preload, start, setWeights, tick, playCard, setMuted,
        get muted() { return muted; },
        get running() { return running; }
    };
}
