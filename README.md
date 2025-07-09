# Afrikan Tarot

A simple static web application for performing ancient Afrikan tarot readings. Card data and images live in the `assets/` folder so they can easily be replaced. The app uses the OpenAI API to fetch card interpretations via the GPT-4o model if an API key is provided.

## Running

This project is designed for GitHub Pages. Push the contents of this repository to a GitHub repo and enable Pages in the repository settings.

Open `index.html` in a browser or visit the GitHub Pages site after deployment. Before drawing cards, store your OpenAI key in the browser console:

```javascript
localStorage.setItem('OPENAI_API_KEY', 'sk-...');
```

Card images should be saved in `assets/images/` and sound effects in `assets/sounds/` using the filenames referenced in `assets/cards.json`.

## Modifying Cards

Edit `assets/cards.json` to add, remove, or change cards. Each card entry contains:

- `id` - unique identifier
- `name` - card name displayed to users
- `image` - path to the image file
- `sound` - path to a sound effect played when drawn
- `traditional` - corresponding name in a standard tarot deck
