# Trainingsoverzicht Ryan Douglas 2026

Statische webapp met het trainingsoverzicht. Bestaat uit één self-contained `index.html`.

## Lokaal bekijken

Open `index.html` rechtstreeks in je browser, of serveer de map:

```bash
python3 -m http.server 8000
```

Ga vervolgens naar http://localhost:8000

## Deployment

Automatisch gedeployed naar GitHub Pages bij elke push naar `main` via `.github/workflows/deploy.yml`.

Activeren in de repo: **Settings → Pages → Source: GitHub Actions**.
