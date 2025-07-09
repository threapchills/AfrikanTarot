# Afrikan Tarot

A simple web application for performing ancient Afrikan tarot readings. Card data and images live in the `assets/` folder so they can easily be replaced. Each card's short interpretation is stored in a local SQLite database so the server can respond instantly. When all three cards are drawn, their traditional names are still sent to the OpenAI API (GPT-4o) to obtain a fortune teller–style interpretation of the overall reading.

## Running

Clone the repository onto any host that supports **Node.js 18 or later** and install the dependencies:

```bash
npm install
```

Create a `.env` file with your OpenAI API key so the server can read it:

```env
OPENAI_API_KEY=your-openai-key-here
```

The `.env` file is listed in `.gitignore` so your API key stays private and is
not committed to version control.

Start the server:

```bash
node server.js
```

The server hosts the static files and proxies requests to the OpenAI API. Visit `http://localhost:3000` in your browser to use the app.
This project requires **Node.js 18 or later** because it relies on the built-in `fetch` API.

On first run the server creates a `tarot.db` SQLite database and populates it with card interpretations from `assets/interpretations.json`. If you modify that file, delete `tarot.db` before restarting the server so it can be regenerated.
The file is generated automatically and should not be committed to version control.

You can deploy to any service that runs Node (for example Render or Vercel). Set the environment variable `OPENAI_API_KEY` and use `node server.js` as the start command.

If the API lives on a different host, set `ALLOWED_ORIGINS` in the environment to a comma–separated list of origins and provide the base URL in the HTML:

```html
<script type="module" src="main.js" data-api-base="https://example.com"></script>
```

`openai.js` reads the `data-api-base` attribute (or `window.API_BASE_URL` if defined) to build the API URLs.

The server enables CORS using the `ALLOWED_ORIGINS` variable, which should contain the same origins that load the front end.

Card images should be saved in `assets/images/` and sound effects in `assets/sounds/` using the filenames referenced in `assets/cards.json`.
If a card does not specify a sound, a short Uhadi percussion track plays when the card is drawn.

## Modifying Cards

Edit `assets/cards.json` to add, remove, or change cards. Each card entry contains:

- `id` - unique identifier
- `name` - card name displayed to users
- `image` - path to the image file
- `sound` - path to a sound effect played when drawn
- `traditional` - corresponding name in a standard tarot deck
