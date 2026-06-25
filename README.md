# 🦷 MondhygiëneCursus – Backend API

Production-ready Node.js + Express backend voor een online cursusplatform over tanden poetsen en flossen.

---

## Tech Stack

| Laag | Technologie |
|---|---|
| Runtime | Node.js ≥ 18 |
| Framework | Express.js |
| Database | PostgreSQL (Neon) |
| Authenticatie | JWT (access + refresh tokens) via httpOnly cookies |
| Betalingen | Mollie API |
| E-mail | Resend |
| Validatie | Zod |
| Security | Helmet, express-rate-limit, bcryptjs |

---

## Projectstructuur

```
dental-course-backend/
├── database/
│   └── schema.sql              # Volledige SQL – plak dit in Neon
├── src/
│   ├── app.js                  # Express entry point
│   ├── controllers/
│   │   ├── authController.js   # Register, login, logout, refresh, me
│   │   ├── coursesController.js
│   │   ├── paymentsController.js
│   │   └── userController.js
│   ├── db/
│   │   └── pool.js             # pg Pool + helpers
│   ├── middleware/
│   │   ├── auth.js             # authenticate + requireRole
│   │   └── errorHandler.js     # global error + 404 handler
│   ├── routes/
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── payments.js
│   │   └── user.js
│   ├── services/
│   │   ├── emailService.js     # Resend integratie
│   │   └── mollieService.js    # Mollie integratie
│   ├── utils/
│   │   └── jwt.js              # Token generatie + verificatie
│   └── validators/
│       └── schemas.js          # Zod schemas + validate middleware
├── .env.example
├── .gitignore
└── package.json
```

---

## Snelstart (lokaal)

### 1. Installeer dependencies

```bash
npm install
```

### 2. Maak een `.env` bestand aan

```bash
cp .env.example .env
```

Vul alle waarden in (zie stap 3–5 hieronder).

### 3. Neon PostgreSQL instellen

1. Ga naar [neon.tech](https://neon.tech) en maak een gratis project aan.
2. Kopieer de **connection string** (begint met `postgresql://...`).
3. Plak deze in `.env` bij `DATABASE_URL`.
4. Open de **SQL Editor** in Neon en plak de volledige inhoud van `database/schema.sql`.
5. Klik op **Run** – alle tabellen, indexes en seed data worden aangemaakt.

### 4. Mollie instellen

1. Maak een account op [mollie.com](https://www.mollie.com/nl).
2. Ga naar **Developers → API keys**.
3. Gebruik de **Test API key** voor development (begint met `test_`).
4. Zet `MOLLIE_API_KEY` in `.env`.
5. Voor local development: gebruik [ngrok](https://ngrok.com) om je localhost publiek te maken:
   ```bash
   ngrok http 3000
   ```
   Gebruik de `https://xxx.ngrok.io` URL als `MOLLIE_WEBHOOK_URL`.

### 5. Resend instellen

1. Maak een account op [resend.com](https://resend.com).
2. Ga naar **API Keys** en genereer een sleutel.
3. Zet `RESEND_API_KEY` in `.env`.
4. Verifieer je domein in Resend voor productie.

### 6. JWT secrets genereren

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Voer dit twee keer uit: één keer voor `JWT_ACCESS_SECRET`, één keer voor `JWT_REFRESH_SECRET`.

### 7. Server starten

```bash
# Development (met auto-reload)
npm run dev

# Production
npm start
```

Server draait op: `http://localhost:3000`

---

## API Endpoints

### Auth

| Method | Endpoint | Toegang | Beschrijving |
|---|---|---|---|
| POST | `/api/auth/register` | Publiek | Account aanmaken |
| POST | `/api/auth/login` | Publiek | Inloggen |
| POST | `/api/auth/logout` | Publiek | Uitloggen + token revoke |
| POST | `/api/auth/refresh` | Cookie | Access token vernieuwen |
| GET  | `/api/auth/me` | Ingelogd | Eigen gebruikersdata |

### Cursussen

| Method | Endpoint | Toegang | Beschrijving |
|---|---|---|---|
| GET | `/api/courses` | Publiek | Alle gepubliceerde cursussen |
| GET | `/api/courses/:id` | Publiek | Cursus detail |

### Betalingen

| Method | Endpoint | Toegang | Beschrijving |
|---|---|---|---|
| POST | `/api/payments/create` | Ingelogd | Start Mollie betaling |
| POST | `/api/payments/webhook` | Mollie | Betaalstatus update |
| GET  | `/api/payments/:id` | Ingelogd | Betaalstatus opvragen |

### Gebruiker

| Method | Endpoint | Toegang | Beschrijving |
|---|---|---|---|
| GET | `/api/user/profile` | Ingelogd | Profiel bekijken |
| GET | `/api/user/courses` | Ingelogd | Gekochte cursussen |

---

## Voorbeeldverzoeken (curl)

```bash
# Registreren
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"name":"Jan Jansen","email":"jan@example.com","password":"Geheim123"}'

# Inloggen
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt -b cookies.txt \
  -d '{"email":"jan@example.com","password":"Geheim123"}'

# Cursussen ophalen
curl http://localhost:3000/api/courses

# Betaling starten (vereist ingelogd zijn)
curl -X POST http://localhost:3000/api/payments/create \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"courseId":"<uuid-van-cursus>"}'

# Mijn cursussen
curl http://localhost:3000/api/user/courses -b cookies.txt
```

---

## Security-maatregelen

- **Helmet** – security headers (XSS, CSRF, clickjacking, etc.)
- **Rate limiting** – globaal + extra streng op auth endpoints (10 req/15 min)
- **httpOnly cookies** – tokens niet toegankelijk via JavaScript
- **Refresh token rotatie** – oud token wordt ingetrokken bij elke refresh
- **bcrypt** – wachtwoorden gehasht met saltRounds=12
- **Zod validatie** – alle input gevalideerd en gesanitized
- **Vage foutmeldingen** – geen user enumeration bij login

---

## Productie deployment

1. Zet `NODE_ENV=production` in je omgevingsvariabelen.
2. Gebruik een platform als **Railway**, **Render**, of **Fly.io**.
3. Stel alle `.env` waarden in als omgevingsvariabelen op je platform.
4. Gebruik een `Procfile` of `start` script: `node src/app.js`.
5. Zorg dat je domein geverifieerd is in Resend.
6. Gebruik de **Live API key** van Mollie (begint met `live_`).
