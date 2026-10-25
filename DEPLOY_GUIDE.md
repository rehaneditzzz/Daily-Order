# Order Desk — Free Hosting Guide (Hinglish)

Total monthly cost: **₹0**. Teen free services use honge:

| Kya | Kahan | Free limit |
|---|---|---|
| Database (sara data + parcel photos) | **MongoDB Atlas** (M0 Free) | 512 MB (~1500+ compressed photos + lakhs of orders) |
| Backend (API) | **Render.com** (Free web service) | 750 hrs/month (24x7 ke liye kaafi) |
| Frontend (app screen) | **Vercel** (Hobby, free) | Unlimited for small teams |

> Card ki zarurat nahi (Render kabhi kabhi verification maang sakta hai, charge nahi karta).

---

## Step 0 — Code GitHub pe daalo
1. Emergent chat me **Save → Save to GitHub** dabao, ek repository banao (jaise `order-desk`).
2. Repo me ye files honi chahiye: `render.yaml` (root), `backend/`, `frontend/`, `frontend/vercel.json`.

---

## Step 1 — MongoDB Atlas (database)
1. https://www.mongodb.com/cloud/atlas/register pe free account banao.
2. **Create cluster → M0 FREE** chuno, region **Mumbai (ap-south-1)** ya nearest.
3. **Database Access → Add New Database User**: username + password banao (password me `@ # /` mat rakho, simple rakho). Role: *Read and write to any database*.
4. **Network Access → Add IP Address → Allow access from anywhere (0.0.0.0/0)** → Confirm. (Render ka IP fixed nahi hota, isliye ye zaruri hai.)
5. **Database → Connect → Drivers** → connection string copy karo, kuch aisa:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   `<password>` ki jagah apna asli password daalo. Isko safe rakho — yahi aapka **MONGO_URL** hai.

---

## Step 2 — Render (backend)
1. https://render.com pe **GitHub se sign up** karo.
2. **New + → Blueprint** → apna `order-desk` repo chuno. Render `render.yaml` padh lega aur service `order-desk-api` dikhayega.
3. Ye **MONGO_URL** maangega → Step 1 wala connection string paste karo → **Apply**.
4. 3-5 minute me deploy hoga. URL milega jaise: `https://order-desk-api.onrender.com`
5. Check karo: browser me `https://order-desk-api.onrender.com/api/` kholo → `{"message":"Order desk API"}` dikhna chahiye.
   - Pehli baar start pe 10 team members (Boss, Rahul Sharma...) apne aap ban jayenge. Team page se naam badal/hata sakte ho.

> Agar Render ne URL alag diya (jaise `order-desk-api-ab12.onrender.com`), to agle step me wahi URL daalna.

---

## Step 3 — Vercel (frontend)
1. GitHub me `frontend/vercel.json` kholo, ye line check karo:
   `"destination": "https://order-desk-api.onrender.com/api/:path*"`
   Agar aapka Render URL alag hai to yahan apna URL daal ke commit karo.
2. https://vercel.com pe **GitHub se sign up** → **Add New → Project** → `order-desk` repo **Import**.
3. **Root Directory → `frontend`** select karo (zaruri!). Framework: **Vite** (auto). Baaki default.
4. **Deploy**. 2-3 minute me URL milega jaise `https://order-desk.vercel.app`.
5. Ye link poori team ko bhejo — mobile, laptop, kahin se bhi chalega, sab devices pe same data.
   - Phone pe: Chrome me link kholo → ⋮ menu → **Add to Home screen** — app jaisa icon ban jayega.

---

## Step 4 — App ko "jaagta" rakho (optional but recommended)
Render free server 15 min koi use na kare to so jaata hai; agli baar kholne pe 30-60 sec lagte hain.
Isse bachne ke liye:
1. https://uptimerobot.com pe free account.
2. **Add New Monitor → HTTP(s)**, URL: `https://order-desk-api.onrender.com/api/`, interval **5 minutes**.
Ab server hamesha ready rahega (750 free hours/month me 24x7 aa jata hai).

---

## Data safety (koi data loss nahi)
- Sara data MongoDB Atlas cloud me save hota hai — server restart/sleep se kuch nahi mitta. Parcel photos bhi database me hi save hoti hain.
- App me **Excel backup** button se kabhi bhi poora data (Orders, Items, Parcels, Activity) `.xlsx` me download karo. Hafte me ek baar download karke Google Drive me rakh lo.
- Atlas free tier me storage 512 MB hai. Photos upload se pehle apne aap chhoti (~300 KB) ho jaati hain. Atlas dashboard me "Storage size" kabhi kabhi dekh lena.

## Code update karna ho to
GitHub pe change push karo → Render aur Vercel dono **apne aap** naya version deploy kar dete hain.

## Problem aaye to
| Problem | Hal |
|---|---|
| App khulti hai par data nahi aata | `frontend/vercel.json` me Render URL sahi hai? `…onrender.com/api/` browser me khul raha hai? |
| Render logs me `ServerSelectionTimeoutError` | Atlas Network Access me `0.0.0.0/0` add hai? MONGO_URL me password sahi hai? |
| Pehli baar bahut slow | Server so raha tha — Step 4 (UptimeRobot) karo |
| Vercel build fail | Root Directory `frontend` set hai? |
