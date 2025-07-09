# Afrikan Tarot

A simple web application for performing ancient Afrikan tarot readings. Card data and images live in the `assets/` folder so they can easily be replaced. The app uses the OpenAI API on the backend to fetch card interpretations via the GPT-4o model. When all three cards are drawn, their traditional names are sent to the API to obtain a fortune teller–style interpretation of the overall reading.

## Running

This project is designed for GitHub Pages. Push the contents of this repository to a GitHub repo and enable Pages in the repository settings.

Install dependencies and start the server:

```bash
npm install
npm start
```

Create a `.env` file with your OpenAI API key so the server can read it:

```env
OPENAI_API_KEY=your-openai-key-here
```

The server hosts the static files and proxies requests to the OpenAI API. Visit `http://localhost:3000` in your browser to use the app.

Card images should be saved in `assets/images/` and sound effects in `assets/sounds/` using the filenames referenced in `assets/cards.json`.
If a card does not specify a sound, a short Uhadi percussion track plays when the card is drawn.

## Modifying Cards

Edit `assets/cards.json` to add, remove, or change cards. Each card entry contains:

- `id` - unique identifier
- `name` - card name displayed to users
- `image` - path to the image file
- `sound` - path to a sound effect played when drawn
- `traditional` - corresponding name in a standard tarot deck
