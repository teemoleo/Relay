# Relay: Handover Dashboard

**FastAPI** backend and **React (Vite)** frontend for a continuity / baton handover workflow.

**Development browser:** The UI was implemented and checked in **Google Chrome**. Layout, spacing, and typography were tuned with Chrome’s engine in mind; **Microsoft Edge** is usually very close. Other browsers should still work but may differ slightly.

## Pre-requisites

- **Python 3.10+** (with `python` on your PATH)
- **Node.js LTS** (with `npm` on your PATH)

No Docker required.

## Folder layout for submission

Your zip (or folder) should look like this:

```text
Relay/
  README.md          ← this file
  run.ps1            ← start script (Windows)
  Relay-Backend/     ← FastAPI app (requirements.txt at root of this folder)
  Relay-Frontend/    ← Vite + React app (package.json at root of this folder)
```

If you use lowercase **`relay-backend`** / **`relay-frontend`** instead, **that is fine** — `run.ps1` looks for those names automatically.

## How to run (Windows)

### Using `run.ps1` (Start Script)

1. Open the project folder (the one that contains `README.md` and `run.ps1`).
2. Select and then right-click **`run.ps1`** → **Run with PowerShell**.
3. If Windows asks whether to run the script, confirm. A second PowerShell window opens for the API; keep it open. In the first window, **Vite** starts the UI and a browser tab opens automatically to the local dev URL (often **http://localhost:5173**; another port if 5173 is busy). The script prefers **Google Chrome** if it is installed; otherwise it uses **Microsoft Edge**. If neither path is found, Vite falls back to your **default** browser.



If **Run with PowerShell** is missing or the script is blocked, use the steps below instead.

## If this throws an error

1. Open **PowerShell**.
2. Go to the folder that contains `README.md` and `run.ps1`:

   ```powershell
   cd path\to\Relay
   ```

3. Allow scripts if Windows blocks them (one-time for the session):

   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

4. Start everything:

   ```powershell
   .\run.ps1
   ```

<h3 id="running-the-backend-and-frontend-yourself">Running the backend and frontend yourself</h3>

Use **two** terminals if you something is not working or you prefer not to use the script. Replace the paths with your project root and folder names (`Relay-Backend` / `Relay-Frontend`)

**Terminal 1 — API (start this first)**

```powershell
cd path\to\Relay\Relay-Backend
python -m pip install -r requirements.txt
python -m app.db.seed
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Leave this running. Wait until Uvicorn reports that it is listening on **http://127.0.0.1:8000**.

**Terminal 2 — UI**

```powershell
cd path\to\Relay\Relay-Frontend
npm install
npm run dev
```

Plain **`npm run dev`** does not open a browser: use the **Local** line in the terminal (or **Ctrl+click** the link if your terminal supports it) — often **http://localhost:5173**. In dev, requests go to `/api` and Vite **proxies** them to `http://127.0.0.1:8000`, so the backend must stay on port **8000** unless you change both Vite and the app config.

To match **`run.ps1`**, use **`npm run dev -- --open`** so a browser opens when Vite is ready. The script also sets the **`BROWSER`** environment variable to Chrome (if present) or Edge so the same app is used; with a plain manual command.

If you run a **production build** without that proxy, set **`VITE_API_BASE_URL=http://127.0.0.1:8000`** (see `.env.example` in the frontend folder).



## If something else fails

- **“python is not recognized”**: Install Python and tick “Add to PATH”, or use the Python Launcher: `py -m pip …`
- **“npm is not recognized”**: Install Node.js LTS.
- **Login / network errors**: The UI talks to the API on **port 8000** (via the dev proxy). Follow [Running the backend and frontend yourself](#running-the-backend-and-frontend-yourself): start **Terminal 1**, confirm the API is up, then start **Terminal 2** and refresh the browser.
- **Port already in use**: Close other copies of Uvicorn/Vite or change the port in your config.




### What `run.ps1` does

- **Backend (this window):** installs Python dependencies (`pip install -r requirements.txt`), runs the database seed (`python -m app.db.seed`).
- **Backend (second window):** starts the API with **Uvicorn** at **http://127.0.0.1:8000** and keeps it running. Leave this window open.
- **Frontend (back in the first window):** runs `npm install`, sets **`BROWSER`** to **Chrome** (if installed) else **Edge**, then **`npm run dev -- --open`**, so a tab opens when the dev server is ready (usually **http://localhost:5173**; another port if 5173 is busy). Plain **`npm run dev`** without the script does not set **`BROWSER`** or auto-open; use the **Local** URL in the terminal instead.

Stop the app by closing the API window and pressing **Ctrl+C** in the frontend window.



## Demo logins

Use these on the login screen (username / password):

| Username        | Password       | Role               |
|----------------|----------------|--------------------|
| `resilience`   | `resilience123`| Resilience manager |
| `bond`         | `engineer123`  | Software engineer  |
| `teamlead`     | `teamlead123`  | Team lead          |


## API docs (optional)

With the backend running:

- **http://127.0.0.1:8000/docs** — Swagger UI (interactive docs and trying out endpoints).
- **http://127.0.0.1:8000/openapi.json** — OpenAPI 3 JSON schema (the machine-readable API spec FastAPI generates from your routes).