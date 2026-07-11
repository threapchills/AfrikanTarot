// cursor.js — custom cursor: a lagging copper ring with contextual
// labels, an instant dot, and a trail of ember sparks whose colour
// follows the current elemental zone. Fine pointers only.

// spark pigments per zone (the canvas multiplies over parchment,
// so these read as tinted darkening): teal, burnt sienna, olive
const TINTS = {
    sky: [82, 138, 142],
    fire: [176, 106, 58],
    earth: [128, 138, 78]
};

export function createCursor() {
    if (!matchMedia('(pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return { tick() {}, dead: true };
    }

    document.body.classList.add('has-cursor');
    const ring = document.getElementById('cursor');
    const dot = document.getElementById('cursorDot');
    const label = document.getElementById('cursorLabel');
    const canvas = document.getElementById('sparks');
    const c2d = canvas.getContext('2d');

    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let lastSpawnX = mx, lastSpawnY = my;
    let zones = { sky: 1, fire: 0, earth: 0 };
    const sparks = [];

    function resize() {
        canvas.width = innerWidth;
        canvas.height = innerHeight;
    }
    resize();
    addEventListener('resize', resize);

    addEventListener('mousemove', (e) => {
        mx = e.clientX;
        my = e.clientY;
        const dx = mx - lastSpawnX, dy = my - lastSpawnY;
        if (dx * dx + dy * dy > 400 && sparks.length < 90) {
            lastSpawnX = mx;
            lastSpawnY = my;
            sparks.push({
                x: mx, y: my,
                vx: (Math.random() - 0.5) * 30 - dx * 0.6,
                vy: (Math.random() - 0.5) * 30 - dy * 0.6 - 26,
                life: 1,
                r: 0.8 + Math.random() * 1.6
            });
        }
    }, { passive: true });

    document.addEventListener('mouseover', (e) => {
        if (!e.target.closest) return;
        // buttons carry their own words; the ring shrinks aside instead
        // of stamping a label over them
        const selfLabelled = e.target.closest('.btn, .kofi-support, .sound-toggle, .brand, #modalClose');
        ring.classList.toggle('quiet', !!selfLabelled);
        const t = !selfLabelled && e.target.closest('[data-cursor]');
        if (t) {
            label.textContent = t.dataset.cursor;
            ring.classList.add('grow');
        } else {
            ring.classList.remove('grow');
        }
    });

    addEventListener('mousedown', () => ring.classList.add('down'));
    addEventListener('mouseup', () => ring.classList.remove('down'));

    function tint() {
        const r = TINTS.sky[0] * zones.sky + TINTS.fire[0] * zones.fire + TINTS.earth[0] * zones.earth;
        const g = TINTS.sky[1] * zones.sky + TINTS.fire[1] * zones.fire + TINTS.earth[1] * zones.earth;
        const b = TINTS.sky[2] * zones.sky + TINTS.fire[2] * zones.fire + TINTS.earth[2] * zones.earth;
        return [r | 0, g | 0, b | 0];
    }

    function tick(dt, state) {
        if (state) zones = state.zones;
        rx += (mx - rx) * Math.min(1, dt * 11);
        ry += (my - ry) * Math.min(1, dt * 11);
        ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
        dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;

        c2d.clearRect(0, 0, canvas.width, canvas.height);
        if (sparks.length) {
            const [r, g, b] = tint();
            for (let i = sparks.length - 1; i >= 0; i--) {
                const s = sparks[i];
                s.life -= dt * 1.4;
                if (s.life <= 0) { sparks.splice(i, 1); continue; }
                s.x += s.vx * dt;
                s.y += s.vy * dt;
                s.vy -= 14 * dt; // embers drift upward
                s.vx *= 1 - dt * 1.6;
                const a = s.life * s.life * 0.7;
                c2d.beginPath();
                c2d.arc(s.x, s.y, s.r * s.life, 0, 6.2832);
                c2d.fillStyle = `rgba(${r},${g},${b},${a})`;
                c2d.fill();
            }
        }
    }

    return { tick, dead: false };
}
