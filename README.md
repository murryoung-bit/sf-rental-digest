# SF Rental Digest

A web app that searches Craigslist, Zillow, Padmapper, Apartments.com, and HotPads for current SF apartment listings using the Anthropic API with web search.

## Stack

- **Frontend**: React + Vite (port 5173)
- **Backend**: Node.js + Express (port 3001)
- **AI**: Anthropic claude-sonnet-4 with web_search tool

## Setup

### 1. Clone / download this folder

```bash
cd sf-rental-digest
```

### 2. Backend

```bash
cd backend
npm install

# Create your .env
cp .env.example .env
# Open .env and paste your Anthropic API key

npm run dev
```

You should see:
```
🏠 SF Rental Digest API
   Running at http://localhost:3001
```

### 3. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

## Environment variables

| Variable | Where | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | `backend/.env` | Your Anthropic API key |
| `VITE_API_URL` | Frontend env (optional) | Override backend URL, e.g. for deployment |

---

## Deploying

### Backend → Railway or Render
1. Push `backend/` to a GitHub repo (or connect directly)
2. Add `ANTHROPIC_API_KEY` as an environment variable
3. Set start command: `node index.js`
4. Note the deployed URL (e.g. `https://sf-digest-api.railway.app`)

### Frontend → Vercel
1. Push `frontend/` to GitHub
2. Import into Vercel
3. Add environment variable: `VITE_API_URL=https://your-railway-url.railway.app`
4. Deploy — Vercel auto-detects Vite

---

## Project structure

```
sf-rental-digest/
├── backend/
│   ├── index.js          # Express server + Anthropic search
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── App.jsx               # Main layout + state
    │   ├── components/
    │   │   ├── FilterPanel.jsx   # Filters sidebar
    │   │   └── ListingCard.jsx   # Individual listing card
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```
