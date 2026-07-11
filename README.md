# Tarot of Ancient Afrika

A three-card reading (past, present, future) from an original Afrikan tarot deck, live at [tarot.mikewhyle.com](https://tarot.mikewhyle.com/).

The site is a fully static, dependency-free scrollytelling experience:

- **A descent through three elements.** The page moves from sky to fire to earth as you scroll. Three ambient drone loops (`sky5`, `fire3`, `earth5`) crossfade with your scroll position via the Web Audio API, and the WebGL background shifts palette in step with them.
- **Raw WebGL, no libraries.** `js/gl.js` renders a procedural background (domain-warped smoke, rising embers, film grain) and "warp planes" that take over every card image in the DOM, so cards liquid-bend with scroll velocity, ripple under the cursor and glitch-burst when revealed.
- **Animated typography.** Split-character reveals, a displacement filter that warps the hero title with scroll velocity, magnetic buttons and a custom ember cursor.
- **The reading itself** is unchanged in spirit: three face-down cards turn in sequence, each with a position-specific interpretation from `assets/interpretations.json`, and any card can be viewed at full size.

## Structure

- `index.html`, `style.css` — the page and its visual system
- `main.js` — boot, preloader gate, the reading logic
- `js/gl.js` — WebGL background and warp planes
- `js/soundscape.js` — ambient crossfade and card sound
- `js/experience.js` — scroll choreography, marquee, parallax, split text
- `js/cursor.js` — custom cursor and ember sparks
- `assets/cards.json` — the deck (name plus image file)
- `assets/interpretations.json` — one interpretation per card per position
- `assets/images/cards/` — full-resolution card art; `thumbs/` holds 560px JPEGs used everywhere except the zoom modal
- `assets/sounds/` — ambient loops in ogg with m4a mirrors for Safari

## Running locally

Any static file server works:

```bash
npx http-server -p 8123
```

Then open `http://localhost:8123`. Audio only decodes after the entry gate is clicked, as browsers require a user gesture.

## Modifying cards

Edit `assets/cards.json` to add or change cards, drop the art into `assets/images/cards/`, and generate a matching thumb, for example:

```bash
ffmpeg -i "assets/images/cards/new card.png" -vf "scale=560:-2" -q:v 6 "assets/images/cards/thumbs/new card.jpg"
```

Interpretations live in `assets/interpretations.json`, keyed as `"<Card Name> - <Position>"` where position is `Past`, `Present` or `Future`.

## Legacy server

`server.js`, `openai.js` and `db.js` are an older Node/OpenAI incarnation of the app and are not used by the static site. They remain for reference; see git history for their documentation.
