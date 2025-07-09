# Afrikan Tarot

A simple web application for performing ancient Afrikan tarot readings. Card data and images live in the `assets/` folder so they can easily be replaced. The app uses the OpenAI API on the backend to fetch card interpretations via the GPT-4o model. When all three cards are drawn, their traditional names are sent to the API to obtain a fortune teller–style interpretation of the overall reading.

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

You can deploy to any service that runs Node (for example Render or Vercel). Set the environment variable `OPENAI_API_KEY` and use `node server.js` as the start command.

The front end expects the API routes to be served from the same origin. If the API is hosted separately you must adjust the URLs in `openai.js` and enable CORS.

Card images should be saved in `assets/images/` and sound effects in `assets/sounds/` using the filenames referenced in `assets/cards.json`.
If a card does not specify a sound, a short Uhadi percussion track plays when the card is drawn.

## Modifying Cards

Edit `assets/cards.json` to add, remove, or change cards. Each card entry contains:

- `id` - unique identifier
- `name` - card name displayed to users
- `image` - path to the image file
- `sound` - path to a sound effect played when drawn
- `traditional` - corresponding name in a standard tarot deck
