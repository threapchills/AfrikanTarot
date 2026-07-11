// gl.js — raw WebGL layer, no libraries.
// Two jobs: a procedural elemental background (smoke, rising embers,
// palette crossfading between sky / fire / earth as you scroll), and
// "warp planes" that take over card images in the DOM so they can
// liquid-bend with scroll velocity, ripple under the mouse and
// glitch-burst on reveal.

const BG_VERT = `
attribute vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const BG_FRAG = `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform vec3 uZone;   // sky, fire, earth weights
uniform float uScroll;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }

float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
}

void main() {
    vec2 uv = gl_FragCoord.xy / uRes;
    vec2 p = uv;
    p.x *= uRes.x / uRes.y;
    float t = uTime;

    // parchment ground with a tinted wash per zone, and dark
    // pigment flecks like inclusions in handmade paper
    vec3 paper = vec3(0.925, 0.885, 0.790);
    vec3 wash = vec3(0.760, 0.815, 0.805) * uZone.x
              + vec3(0.885, 0.790, 0.645) * uZone.y
              + vec3(0.805, 0.815, 0.680) * uZone.z;
    vec3 pigment = vec3(0.13, 0.32, 0.34) * uZone.x
                 + vec3(0.46, 0.23, 0.10) * uZone.y
                 + vec3(0.28, 0.30, 0.12) * uZone.z;

    // domain-warped wash, drifting with time and a touch of scroll parallax
    vec2 sp = p * 2.1 + vec2(0.0, uScroll * 0.00018);
    float sm = fbm(sp + vec2(t * 0.028, -t * 0.041));
    sm = fbm(sp + sm * 1.7 + vec2(t * 0.017, t * 0.008));
    vec3 col = mix(paper, wash, smoothstep(0.3, 0.9, sm) * 0.55);

    // labradorite sheen: a faint iridescent band gliding over the paper
    float flash = fbm(p * 3.1 - vec2(t * 0.05, t * 0.021));
    col += vec3(0.030, 0.055, 0.050) * smoothstep(0.6, 0.92, flash);

    // drifting pigment flecks, three depth layers
    for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float scale = 13.0 + fi * 11.0;
        vec2 q = vec2(uv.x + fi * 0.37, uv.y + t * (0.011 + fi * 0.012) + uScroll * 0.00006 * (1.0 + fi));
        q *= scale;
        vec2 cell = floor(q);
        vec2 fpos = fract(q);
        float h = hash(cell);
        vec2 pt = vec2(0.2 + 0.6 * fract(h * 7.13), 0.2 + 0.6 * fract(h * 3.71));
        float d = length(fpos - pt);
        float tw = 0.5 + 0.5 * sin(t * (1.0 + h * 3.0) + h * 40.0);
        float s = smoothstep(0.045 + h * 0.03, 0.0, d) * tw * step(0.35, h);
        col = mix(col, pigment, s * (0.38 - fi * 0.09));
    }

    // soft brightening under the cursor, like light through paper
    vec2 mp = vec2(uMouse.x / uRes.x * (uRes.x / uRes.y), 1.0 - uMouse.y / uRes.y);
    float md = distance(p, mp);
    col += vec3(0.055, 0.048, 0.030) * exp(-md * 3.4);

    // aged page edges + paper grain
    float vig = smoothstep(1.3, 0.32, distance(uv, vec2(0.5, 0.45)));
    col = mix(col * vec3(0.84, 0.76, 0.62), col, vig);
    col += (hash(uv * uRes + fract(t) * 61.7) - 0.5) * 0.02;

    gl_FragColor = vec4(col, 1.0);
}
`;

const PLANE_VERT = `
attribute vec2 aPos;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform vec2 uSize;
uniform float uAngle;
uniform float uVel;
uniform float uTime;
uniform float uFlex;
uniform float uHover;
varying vec2 vUv;

void main() {
    vUv = aPos;
    vec2 local = (aPos - 0.5) * uSize;
    // liquid bow: the middle of the card lags behind the scroll
    float bow = sin(aPos.x * 3.14159265);
    local.y += uVel * 0.16 * bow * uFlex;
    // faint breathing while hovered
    local += vec2(sin(uTime * 2.0 + aPos.y * 8.0), cos(uTime * 1.7 + aPos.x * 8.0)) * uHover * 1.4;
    float c = cos(uAngle), s = sin(uAngle);
    vec2 rot = vec2(local.x * c - local.y * s, local.x * s + local.y * c);
    vec2 pos = uCenter + rot;
    vec2 clip = pos / uRes * 2.0 - 1.0;
    gl_Position = vec4(clip.x, -clip.y, 0.0, 1.0);
}
`;

const PLANE_FRAG = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform float uTime;
uniform float uHover;
uniform float uBurst;
uniform float uVel;
uniform float uOpacity;
uniform float uFlex;
uniform float uShadow;
uniform float uChroma;
uniform vec2 uMouse;

float hash(float n) { return fract(sin(n) * 43758.5453123); }

void main() {
    vec2 uv = vUv;

    // shadow pass: a soft umber pool under the card, bending with it
    if (uShadow > 0.5) {
        vec2 es = smoothstep(vec2(0.0), vec2(0.3), uv) * smoothstep(vec2(0.0), vec2(0.3), vec2(1.0) - uv);
        float sa = es.x * es.y;
        sa = sa * sa * 0.34 * uOpacity;
        gl_FragColor = vec4(vec3(0.15, 0.10, 0.05) * sa, sa);
        return;
    }

    // ripple radiating from the cursor
    vec2 dir = uv - uMouse;
    float d = length(dir) + 1e-4;
    float rip = sin(d * 26.0 - uTime * 6.5) * exp(-d * 4.0) * 0.03 * uHover;
    uv += dir / d * rip;

    // scroll-velocity liquid wave
    float lv = clamp(uVel * 0.0012, -0.5, 0.5) * uFlex;
    uv.x += sin(uv.y * 6.28318 + uTime * 1.4) * lv * 0.05;

    // glitch slices during a reveal burst
    if (uBurst > 0.004) {
        float row = floor(uv.y * 13.0);
        float jt = hash(row * 7.31 + floor(uTime * 22.0) * 3.7);
        uv.x += (jt - 0.5) * 0.3 * uBurst * step(0.4, jt);
        uv.y += (hash(row * 3.7 + 1.0) - 0.5) * 0.05 * uBurst;
    }

    // chromatic split scales with energy; some planes barely split
    float split = (0.005 * uHover + 0.014 * uBurst + abs(lv) * 0.05) * uChroma;
    vec2 so = vec2(split, 0.0);
    vec4 cc = texture2D(uTex, uv);
    float r = texture2D(uTex, uv + so).r;
    float b = texture2D(uTex, uv - so).b;
    vec3 col = vec3(r, cc.g, b);

    // soft edges, hard cut outside the plane
    vec2 e = smoothstep(vec2(0.0), vec2(0.015), uv) * smoothstep(vec2(0.0), vec2(0.015), vec2(1.0) - uv);
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
    float a = cc.a * e.x * e.y * inside * uOpacity;
    gl_FragColor = vec4(col * a, a);
}
`;

function compile(gl, type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('shader error:', gl.getShaderInfoLog(sh));
        return null;
    }
    return sh;
}

function link(gl, vsrc, fsrc) {
    const vs = compile(gl, gl.VERTEX_SHADER, vsrc);
    const fs = compile(gl, gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) return null;
    const prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    return prog;
}

export function createGL() {
    const canvas = document.getElementById('gl');
    let gl = null;
    try {
        gl = canvas.getContext('webgl', {
            alpha: false, antialias: false, depth: false, stencil: false,
            powerPreference: 'high-performance'
        });
    } catch (e) { /* fall through */ }
    if (!gl) { canvas.style.display = 'none'; return null; }

    const bgProg = link(gl, BG_VERT, BG_FRAG);
    const plProg = link(gl, PLANE_VERT, PLANE_FRAG);
    if (!bgProg || !plProg) { canvas.style.display = 'none'; return null; }

    // fullscreen quad
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    // shared subdivided grid for planes (vertex-level bending)
    const COLS = 24, ROWS = 36;
    const verts = [];
    for (let y = 0; y <= ROWS; y++)
        for (let x = 0; x <= COLS; x++)
            verts.push(x / COLS, y / ROWS);
    const idx = [];
    for (let y = 0; y < ROWS; y++)
        for (let x = 0; x < COLS; x++) {
            const a = y * (COLS + 1) + x, b = a + 1, c = a + COLS + 1, d = c + 1;
            idx.push(a, c, b, b, c, d);
        }
    const gridBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verts), gl.STATIC_DRAW);
    const gridIdx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(idx), gl.STATIC_DRAW);
    const gridCount = idx.length;

    const bgU = {
        aPos: gl.getAttribLocation(bgProg, 'aPos'),
        uRes: gl.getUniformLocation(bgProg, 'uRes'),
        uTime: gl.getUniformLocation(bgProg, 'uTime'),
        uMouse: gl.getUniformLocation(bgProg, 'uMouse'),
        uZone: gl.getUniformLocation(bgProg, 'uZone'),
        uScroll: gl.getUniformLocation(bgProg, 'uScroll')
    };
    const plU = {};
    for (const n of ['uRes', 'uCenter', 'uSize', 'uAngle', 'uVel', 'uTime', 'uFlex', 'uHover', 'uBurst', 'uOpacity', 'uMouse', 'uTex', 'uShadow', 'uChroma'])
        plU[n] = gl.getUniformLocation(plProg, n);
    plU.aPos = gl.getAttribLocation(plProg, 'aPos');

    let dpr = 1, vw = 0, vh = 0;
    function resize() {
        dpr = Math.min(window.devicePixelRatio || 1, matchMedia('(pointer:coarse)').matches ? 1.3 : 1.75);
        vw = window.innerWidth;
        vh = window.innerHeight;
        canvas.width = Math.round(vw * dpr);
        canvas.height = Math.round(vh * dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const planes = [];
    const texCache = new Map();

    function getTexture(src, onReady) {
        if (texCache.has(src)) {
            const entry = texCache.get(src);
            if (entry.ready) onReady && onReady();
            else entry.cbs.push(onReady);
            return entry;
        }
        const entry = { tex: gl.createTexture(), ready: false, cbs: [onReady] };
        texCache.set(src, entry);
        const img = new Image();
        img.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, entry.tex);
            gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            entry.ready = true;
            entry.cbs.forEach(cb => cb && cb());
            entry.cbs = [];
        };
        img.src = src;
        return entry;
    }

    function addPlane(el, src, opts = {}) {
        if (dead) return;
        const plane = {
            el,
            src,
            entry: null,
            angle: (parseFloat(el.dataset.rot || opts.angle || 0) * Math.PI) / 180,
            flex: opts.flex != null ? opts.flex : 1,
            hover: 0,
            mouseUV: [0.5, 0.5],
            burst: 0,
            opacity: opts.opacity != null ? opts.opacity : 1,
            shadow: opts.shadow !== false,
            chroma: opts.chroma != null ? opts.chroma : 1,
            // an element whose CSS opacity the plane inherits, so planes
            // respect DOM fade-ins instead of painting at full strength
            fadeEl: opts.fadeEl || null
        };
        plane.entry = getTexture(src, () => {
            el.classList.add('gl-live');
            if (opts.onReady) opts.onReady();
        });
        planes.push(plane);
        return plane;
    }

    function removePlane(el) {
        const i = planes.findIndex(p => p.el === el);
        if (i >= 0) {
            planes[i].el.classList.remove('gl-live');
            planes.splice(i, 1);
        }
    }

    function burst(el) {
        const p = planes.find(p => p.el === el);
        if (p) p.burst = 1;
    }

    let dead = false;
    canvas.addEventListener('webglcontextlost', (e) => {
        e.preventDefault();
        dead = true;
        canvas.style.display = 'none';
        planes.forEach(p => p.el.classList.remove('gl-live'));
    });

    function render(state, t, dt) {
        if (dead) return;
        // catch missed resize events (rotation, late layout) cheaply
        if (vw !== window.innerWidth || vh !== window.innerHeight || canvas.width === 0) resize();
        if (canvas.width === 0) return;
        gl.viewport(0, 0, canvas.width, canvas.height);

        // background
        gl.disable(gl.BLEND);
        gl.useProgram(bgProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
        gl.enableVertexAttribArray(bgU.aPos);
        gl.vertexAttribPointer(bgU.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.uniform2f(bgU.uRes, canvas.width, canvas.height);
        gl.uniform1f(bgU.uTime, t);
        gl.uniform2f(bgU.uMouse, state.mx * dpr, state.my * dpr);
        gl.uniform3f(bgU.uZone, state.zones.sky, state.zones.fire, state.zones.earth);
        gl.uniform1f(bgU.uScroll, state.y * dpr);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (!planes.length) return;

        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(plProg);
        gl.bindBuffer(gl.ARRAY_BUFFER, gridBuf);
        gl.enableVertexAttribArray(plU.aPos);
        gl.vertexAttribPointer(plU.aPos, 2, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gridIdx);
        gl.uniform2f(plU.uRes, canvas.width, canvas.height);
        gl.uniform1f(plU.uTime, t);
        gl.uniform1f(plU.uVel, state.vel * dpr);
        gl.uniform1i(plU.uTex, 0);
        gl.activeTexture(gl.TEXTURE0);

        const lerpK = Math.min(1, dt * 7);
        for (const p of planes) {
            if (!p.entry.ready) continue;
            const r = p.el.getBoundingClientRect();
            if (r.bottom < -140 || r.top > vh + 140 || r.right < -140 || r.left > vw + 140) continue;

            // hover + local mouse position (skipped on touch devices)
            let target = 0;
            if (!state.coarse && state.mx >= r.left && state.mx <= r.right && state.my >= r.top && state.my <= r.bottom) {
                target = 1;
                p.mouseUV[0] = (state.mx - r.left) / r.width;
                p.mouseUV[1] = (state.my - r.top) / r.height;
            }
            p.hover += (target - p.hover) * lerpK;
            if (p.burst > 0) p.burst = Math.max(0, p.burst - dt * 1.35);

            let opacity = p.opacity;
            if (p.fadeEl) {
                opacity *= parseFloat(getComputedStyle(p.fadeEl).opacity) || 0;
                if (opacity < 0.01) continue;
            }

            const cx = (r.left + r.width / 2) * dpr;
            const cy = (r.top + r.height / 2) * dpr;
            let w, h;
            if (p.angle !== 0) {
                w = p.el.offsetWidth * dpr;
                h = p.el.offsetHeight * dpr;
            } else {
                w = r.width * dpr;
                h = r.height * dpr;
            }

            gl.bindTexture(gl.TEXTURE_2D, p.entry.tex);
            gl.uniform1f(plU.uAngle, p.angle);
            gl.uniform1f(plU.uFlex, p.flex);
            gl.uniform1f(plU.uHover, p.hover);
            gl.uniform1f(plU.uBurst, p.burst);
            gl.uniform1f(plU.uOpacity, opacity);
            gl.uniform1f(plU.uChroma, p.chroma);
            gl.uniform2f(plU.uMouse, p.mouseUV[0], p.mouseUV[1]);

            if (p.shadow) {
                gl.uniform1f(plU.uShadow, 1);
                gl.uniform2f(plU.uCenter, cx, cy + 16 * dpr);
                gl.uniform2f(plU.uSize, w * 1.06, h * 1.06);
                gl.drawElements(gl.TRIANGLES, gridCount, gl.UNSIGNED_SHORT, 0);
            }
            gl.uniform1f(plU.uShadow, 0);
            gl.uniform2f(plU.uCenter, cx, cy);
            gl.uniform2f(plU.uSize, w, h);
            gl.drawElements(gl.TRIANGLES, gridCount, gl.UNSIGNED_SHORT, 0);
        }
    }

    return { addPlane, removePlane, burst, render };
}
