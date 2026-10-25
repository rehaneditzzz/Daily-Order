# Order Desk — Pharma Export Order Management

Team ke liye order management app: clients, medicines, multiple parcels/addresses, tracking IDs, parcel photos,
billing/packing checklist, procurement list, WhatsApp share, Excel backup.

- **Backend:** Python 3.11 + FastAPI + MongoDB (`backend/`)
- **Frontend:** React 19 + Vite + TypeScript + Tailwind (`frontend/`)

---

## 1. Folder structure (kaunsi file kahan)

```
order-desk/
├── README.md              ← ye file (local setup)
├── DEPLOY_GUIDE.md        ← free hosting guide (Atlas + Render + Vercel)
├── render.yaml            ← Render backend settings (root me hi rehni chahiye)
├── .gitignore
│
├── backend/
│   ├── server.py          ← app start point (FastAPI)
│   ├── seed.py            ← optional: sample data daalne ke liye
│   ├── requirements.txt   ← Python packages
│   ├── .env.example       ← isko copy karke .env banao
│   ├── lib/
│   │   ├── __init__.py
│   │   ├── db.py          ← MongoDB connection
│   │   └── dates.py
│   ├── models/
│   │   ├── __init__.py
│   │   └── order.py       ← data models (Order, Item, Shipment, Member)
│   └── routers/
│       ├── __init__.py
│       ├── orders.py      ← orders, items, parcels, photos, dashboard, procurement, Excel
│       └── members.py     ← team members
│
└── frontend/
    ├── package.json
    ├── yarn.lock
    ├── vite.config.ts     ← local me /api ko backend (port 8001) pe bhejta hai
    ├── vercel.json        ← Vercel pe /api ko Render backend pe bhejta hai
    ├── index.html
    ├── tsconfig*.json, components.json
    ├── public/            ← icons
    └── src/
        ├── main.tsx, App.tsx, index.css
        ├── pages/         ← Dashboard, Orders, OrderDetail, Procurement, Team
        ├── components/    ← ItemsTable, ShipmentCard, NewOrderDialog, WhatsAppDialog, Layout...
        │   └── ui/        ← buttons, inputs, dialogs (UI kit)
        └── lib/           ← api.ts, queries.ts, types.ts, helpers.ts
```

> Zip extract karne pe ye structure apne aap ban jayega — kuch move karne ki zarurat nahi.

---

## 2. Computer pe kya install karna hai (ek baar)

| Software | Version | Link |
|---|---|---|
| VS Code | latest | https://code.visualstudio.com |
| Python | **3.11** (3.10–3.12 bhi chalega) | https://www.python.org/downloads/ — install me **"Add Python to PATH"** tick karo |
| Node.js | **20.19+ ya 22 LTS** | https://nodejs.org |
| Yarn | — | terminal me: `npm install -g yarn` |
| MongoDB | Local (Community Server) **ya** Atlas free cloud | https://www.mongodb.com/try/download/community  /  https://www.mongodb.com/cloud/atlas |

> Local MongoDB install nahi karna? Seedha Atlas free cluster bana lo (DEPLOY_GUIDE.md Step 1) aur uska URL `.env` me daal do — same data local aur online dono me dikhega.

---

## 3. VS Code me local chalana

VS Code me `order-desk` folder kholo (**File → Open Folder**). Do terminal kholne hain (**Terminal → New Terminal**, phir `+`).

### Terminal 1 — Backend
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```
Ab `.env` file banao: `backend/.env.example` ko copy karke naam `backend/.env` rakho, aur `MONGO_URL` sahi karo.
```bash
# Windows:  copy .env.example .env
# Mac/Linux: cp .env.example .env

uvicorn server:app --reload --port 8001
```
Check: browser me http://localhost:8001/api/ → `{"message":"Order desk API"}`

(Optional) sample orders daalne ke liye: `python seed.py`

### Terminal 2 — Frontend
```bash
cd frontend
yarn install
yarn dev
```
App kholo: **http://localhost:3000** 🎉

> Same Wi-Fi pe phone se kholna ho to: `yarn dev --host` chalao aur phone me `http://<computer-ka-IP>:3000` kholo.

---

## 4. Online deploy (free, team kahin se bhi use kare)

Poori step-by-step guide: **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)**

Short me:
1. Ye folder apne GitHub account me naya repo bana ke upload karo
   (github.com → New repository → "uploading an existing file" → poora folder drag-drop; `node_modules`, `venv`, `.env` **upload mat karna**).
2. **MongoDB Atlas** → free cluster → connection string (= `MONGO_URL`).
3. **Render.com** → New → Blueprint → repo chuno → `MONGO_URL` paste → backend URL milega.
4. `frontend/vercel.json` me Render URL check/update karo.
5. **Vercel.com** → Import repo → **Root Directory = `frontend`** → Deploy → team ko link bhejo.

---

## 5. Common problems

| Problem | Hal |
|---|---|
| `python` command not found | Python install karte waqt "Add to PATH" tick karo, ya `py` use karo (Windows) |
| `venv\Scripts\activate` error (PowerShell) | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` chalao, ya Command Prompt use karo |
| Backend: `ServerSelectionTimeoutError` | MongoDB chal raha hai? Atlas me Network Access `0.0.0.0/0` hai? `.env` me MONGO_URL sahi? |
| Frontend khulta hai par data nahi | Backend terminal chal raha hai port **8001** pe? |
| `yarn` not found | `npm install -g yarn` |
| Port 3000 busy | `yarn dev --port 3001` |

## 6. Data backup
App me **Excel backup** button → poora data `.xlsx` me download. Hafte me ek baar karke Google Drive me rakh lo.
