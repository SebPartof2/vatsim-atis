
# VATSIM ATIS Viewer

A simple React app to view VATSIM ATIS station information. Fetches live data from [VATSIM AFV ATIS Data](https://data.vatsim.net/v3/afv-atis-data.json).

## Features
- Search/filter by ICAO code or airport name
- Displays frequency, ATIS text, and last updated time
- Clean, modern UI

## Getting Started

1. Install dependencies:
	```sh
	npm install
	```
2. Start development server:
	```sh
	npm run dev
	```
3. Build for production:
	```sh
	npm run build
	```

## Deploying to Cloudflare Pages
- Build the app (`npm run build`)
- Upload the `dist` folder to Cloudflare Pages

## License
MIT
