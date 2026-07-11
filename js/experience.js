// experience.js — the scroll choreography: velocity tracking, elemental
// zone crossfades, split-text reveals, parallax, the card marquee,
// magnetic buttons, hero drift and the typographic warp filter.

export function createExperience() {
    const state = {
        y: window.scrollY,
        vel: 0,
        mx: innerWidth / 2,
        my: innerHeight / 2,
        zones: { sky: 1, fire: 0, earth: 0 },
        reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        coarse: matchMedia('(pointer: coarse)').matches
    };

    addEventListener('mousemove', (e) => {
        state.mx = e.clientX;
        state.my = e.clientY;
    }, { passive: true });

    /* ---------- split text into chars / words ---------- */

    function splitChars(el) {
        const text = el.textContent;
        el.textContent = '';
        let i = 0;
        for (const ch of text) {
            if (ch === ' ') {
                el.appendChild(document.createTextNode(' '));
                continue;
            }
            const s = document.createElement('span');
            s.className = 'char';
            s.textContent = ch;
            s.style.setProperty('--i', i++);
            el.appendChild(s);
        }
    }

    function splitWords(el) {
        const words = el.textContent.split(/\s+/).filter(Boolean);
        el.textContent = '';
        words.forEach((w, i) => {
            const s = document.createElement('span');
            s.className = 'wd';
            s.textContent = w;
            s.style.setProperty('--i', i);
            el.appendChild(s);
            el.appendChild(document.createTextNode(' '));
        });
    }

    document.querySelectorAll('[data-split]').forEach(splitChars);
    document.querySelectorAll('[data-words]').forEach(splitWords);

    /* ---------- scroll reveals ---------- */

    const reveals = document.querySelectorAll('.reveal');
    if (state.reduced) {
        reveals.forEach(el => el.classList.add('inview'));
    } else {
        const io = new IntersectionObserver((entries) => {
            for (const en of entries) {
                if (en.isIntersecting) {
                    en.target.classList.add('inview');
                    io.unobserve(en.target);
                }
            }
        }, { threshold: 0.18 });
        reveals.forEach(el => io.observe(el));
    }

    /* ---------- parallax registry ---------- */

    const paraEls = [];
    function measureParallax() {
        paraEls.length = 0;
        document.querySelectorAll('[data-para]').forEach(el => {
            const prev = el.style.transform;
            el.style.transform = 'none';
            const r = el.getBoundingClientRect();
            el.style.transform = prev;
            paraEls.push({
                el,
                factor: parseFloat(el.dataset.para),
                center: r.top + window.scrollY + r.height / 2
            });
        });
    }
    measureParallax();
    addEventListener('resize', () => setTimeout(measureParallax, 120));

    /* ---------- zone weights (drive audio + GL palette) ---------- */

    const zoneEls = [...document.querySelectorAll('section[data-zone]')];

    function zoneTargets() {
        const t = { sky: 0, fire: 0, earth: 0 };
        const vh = innerHeight;
        let sum = 0;
        for (const el of zoneEls) {
            const r = el.getBoundingClientRect();
            const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            if (overlap > 0) {
                t[el.dataset.zone] += overlap;
                sum += overlap;
            }
        }
        if (sum > 0) for (const k in t) t[k] /= sum;
        else t.sky = 1;
        return t;
    }

    /* ---------- marquee ---------- */

    const rows = [];
    function buildMarquee(cardsByFile, gl, deckNames) {
        const rowFiles = [
            ['magician.png', 'ace of fire.png', 'queen of water.png', 'tracker.png', 'the earthfather.png', 'five of air.png', 'king of bone.png', 'suntribe.png'],
            ['matriarch.png', 'two of water.png', 'FIRE EATER.png', 'seven of bone.png', 'strength.png', 'three of air.png', 'fire pit.png', 'temperence.png']
        ];
        const rowEls = document.querySelectorAll('.marquee-row');
        rowEls.forEach((rowEl, ri) => {
            const track = rowEl.querySelector('.marquee-track');
            const files = rowFiles[ri];
            const imgs = [];
            for (let rep = 0; rep < 2; rep++) {
                for (const f of files) {
                    const img = document.createElement('img');
                    img.src = 'assets/images/cards/thumbs/' + f.replace(/\.png$/i, '.jpg');
                    img.alt = cardsByFile[f] || '';
                    img.dataset.file = f;
                    img.className = 'warp';
                    img.draggable = false;
                    img.setAttribute('data-cursor', 'view');
                    track.appendChild(img);
                    imgs.push(img);
                }
            }
            rows.push({ track, dir: parseFloat(rowEl.dataset.dir), offset: ri * -140, half: 0, imgs });

            // the DOM imgs fetch these thumbs anyway, so the GL textures are free
            if (gl && !state.reduced) imgs.forEach(img => gl.addPlane(img, img.src, { flex: 1.25 }));
        });
    }

    /* ---------- magnetic buttons ---------- */

    const magnets = [...document.querySelectorAll('[data-magnet]')].map(el => ({ el, tx: 0, ty: 0 }));

    /* ---------- headings shear with scroll velocity ---------- */

    const giants = [...document.querySelectorAll('.giant')];

    /* ---------- hero fan drift ---------- */

    const fanCards = [...document.querySelectorAll('.fan-card')];

    /* ---------- hero title warp filter ---------- */

    const heroTitle = document.getElementById('heroTitle');
    const warpDisp = document.getElementById('warpDisp');
    let titleHover = 0;
    if (heroTitle) {
        heroTitle.addEventListener('mouseenter', () => { titleHover = 1; });
        heroTitle.addEventListener('mouseleave', () => { titleHover = 0; });
    }
    let warpActive = false;

    /* ---------- scroll cue + progress ---------- */

    const cue = document.getElementById('scrollCue');
    const progress = document.getElementById('progress');

    /* ---------- per-frame update ---------- */

    let lastY = window.scrollY;

    function update(t, dt) {
        const y = window.scrollY;
        const rawVel = (y - lastY) / Math.max(dt * 60, 0.5);
        lastY = y;
        state.y = y;
        state.vel += (rawVel - state.vel) * Math.min(1, dt * 6.5);
        if (Math.abs(state.vel) < 0.01) state.vel = 0;

        // zones ease toward what the viewport is looking at
        const zt = zoneTargets();
        const zk = Math.min(1, dt * 2.2);
        state.zones.sky += (zt.sky - state.zones.sky) * zk;
        state.zones.fire += (zt.fire - state.zones.fire) * zk;
        state.zones.earth += (zt.earth - state.zones.earth) * zk;

        // cue + progress work for everyone, including reduced motion
        if (cue && y > 60 && !cue.classList.contains('hidden')) cue.classList.add('hidden');
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);

        if (state.reduced) return;

        // parallax
        const vhHalf = innerHeight / 2;
        for (const p of paraEls) {
            const off = (y + vhHalf - p.center) * p.factor;
            p.el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
        }

        // marquee drift, boosted and sheared by scroll velocity
        const boost = Math.min(340, Math.abs(state.vel) * 26);
        const shear = Math.max(-5, Math.min(5, -state.vel * 0.14));
        for (const row of rows) {
            if (!row.half) row.half = row.track.scrollWidth / 2;
            if (!row.half) continue;
            row.offset += row.dir * (30 + boost) * dt;
            row.offset = ((row.offset % row.half) + row.half) % row.half;
            row.track.style.transform = `translate3d(${(-row.offset).toFixed(1)}px, 0, 0) skewX(${shear.toFixed(2)}deg)`;
        }

        // the big type leans into the scroll, settling as it slows
        const lean = Math.max(-3.2, Math.min(3.2, state.vel * 0.075));
        for (const g of giants) {
            g.style.transform = lean !== 0 ? `skewY(${lean.toFixed(2)}deg)` : '';
        }

        // magnetic buttons
        for (const m of magnets) {
            const r = m.el.getBoundingClientRect();
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
            const dx = state.mx - cx, dy = state.my - cy;
            const d = Math.hypot(dx, dy);
            const pull = d < 150 ? 0.3 : 0;
            m.tx += (dx * pull - m.tx) * Math.min(1, dt * 8);
            m.ty += (dy * pull - m.ty) * Math.min(1, dt * 8);
            m.el.style.transform = `translate3d(${m.tx.toFixed(1)}px, ${m.ty.toFixed(1)}px, 0)`;
        }

        // hero fan mouse drift
        if (y < innerHeight * 1.2 && !state.coarse) {
            const nx = (state.mx - innerWidth / 2) / innerWidth;
            const ny = (state.my - innerHeight / 2) / innerHeight;
            for (const card of fanCards) {
                const depth = parseFloat(card.dataset.depth || 0.5);
                card.style.transform = `translate3d(${(-nx * 42 * depth).toFixed(1)}px, ${(-ny * 26 * depth).toFixed(1)}px, 0)`;
            }
        }

        // typographic liquid warp driven by velocity or hover
        if (heroTitle && warpDisp) {
            const scale = Math.max(Math.min(Math.abs(state.vel) * 1.9, 32), titleHover * 15);
            if (scale > 0.6) {
                warpDisp.setAttribute('scale', scale.toFixed(1));
                if (!warpActive) {
                    heroTitle.style.filter = 'url(#warpFilter)';
                    warpActive = true;
                }
            } else if (warpActive) {
                heroTitle.style.filter = 'none';
                warpActive = false;
            }
        }

    }

    return { state, update, buildMarquee, splitChars, splitWords, measureParallax };
}
