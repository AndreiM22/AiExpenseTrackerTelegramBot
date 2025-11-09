MVP – „Expense Bot AI”

Scop

Botul permite introducerea cheltuielilor în 3 moduri, dar toate procesele de analiză și corectare sunt făcute prin Groq AI:
	1.	📸 Imagine cu bon – Groq AI extrage textul (nu se folosește OCR clasic) și îl structurează.
	2.	🎙️ Voce – Groq AI transcrie, corectează și interpretează suma, data, categoria etc.
	3.	✍️ Manual – utilizatorul scrie text liber; Groq AI îl normalizează și sugerează categorii/corecturi.

Fiecare cheltuială e stocată într-o bază de date PostgreSQL, criptată, și este vizibilă doar proprietarului (sau grupului, dacă e într-un chat de grup).

⸻

🧠 Arhitectură actualizată
	•	Backend: Python + FastAPI
	•	AI layer: Groq AI (model pentru OCR-like, ASR, NLP)
	•	Database: PostgreSQL
	•	Storage: S3 / local
	•	Auth: JWT + Telegram/Matrix/Chatwoot ID mapping
	•	Encryption: AES-GCM (aplicație-level)
	•	Optional: Celery/RQ doar pentru sarcini asincrone mari

⸻

📂 Structură DB revizuită

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE,
  display_name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text,
  icon text,
  is_default boolean DEFAULT false,
  UNIQUE(user_id, name)
);

CREATE TABLE expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES users(id) NOT NULL,
  group_id uuid REFERENCES groups(id),
  source text NOT NULL, -- photo | voice | manual
  amount numeric(12,2),
  currency varchar(10),
  vendor text,
  purchase_date date,
  category_id uuid REFERENCES categories(id),
  json_data jsonb, -- parsed info returned by Groq
  ai_confidence float,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);


⸻

🧩 Fluxuri Groq AI

1️⃣ Imagine (photo → Groq AI)
	1.	User trimite poză.
	2.	Backend salvează imaginea, apelează Groq AI OCR Model endpoint:
POST /groq/vision/receipt → returnează JSON cu amount, vendor, date, items etc.
	3.	Modelul normalizează și validează datele.
	4.	Backend salvează răspunsul JSON + confidence.
	5.	Botul afișează rezultatul + buton „Confirmă / Editează”.

2️⃣ Voce (voice → Groq AI)
	1.	User trimite mesaj vocal.
	2.	Audio → Groq AI speech model (ASR + understanding).
	3.	Modelul returnează text structurat + interpretare.
	4.	Backend salvează datele JSON.

3️⃣ Manual (text → Groq AI)
	1.	User scrie: „am cumpărat 2 cafea cu 60 lei”.
	2.	Groq AI text model procesează promptul, extrage câmpurile, corectează ortografia și sugerează categorie.
	3.	Dacă user are categorii personalizate, modelul se aliniază la acelea (trimise în context).

⸻

🧱 API FastAPI (endpoints esențiale)
	•	POST /api/v1/expenses/photo
	•	POST /api/v1/expenses/voice
	•	POST /api/v1/expenses/manual
	•	GET /api/v1/expenses
	•	POST /api/v1/categories — create custom category
	•	GET /api/v1/categories — list user categories
	•	PUT /api/v1/categories/{id} — edit category
	•	DELETE /api/v1/categories/{id}

⸻

🧾 Schema JSON Groq AI response (uniformă pentru toate modurile)

{
  "amount": 249.90,
  "currency": "MDL",
  "vendor": "Linella",
  "purchase_date": "2025-11-02",
  "category": "Groceries",
  "items": [
    {"name":"Cafea Lavazza","qty":1,"price":199.9},
    {"name":"Lapte","qty":1,"price":50}
  ],
  "notes": "Bon fiscal",
  "language": "ro",
  "confidence": 0.94
}


⸻

🔐 Securitate și privatizare
	•	Toate câmpurile criptate cu AES-GCM la nivel de aplicație.
	•	Fiecare user are propriile chei de criptare (stocate separat).
	•	Grupurile au permisiuni RBAC simple: viewer | editor | admin.
	•	Groq AI nu păstrează datele sensibile; răspunsurile sunt procesate și șterse local.

⸻

📊 Funcționalități pentru MVP

Funcționalitate	Descriere	Status
Upload photo + Groq vision parse	Extrage date din bon	MVP
Upload voice + Groq speech parse	Extrage date din mesaj vocal	MVP
Input text + Groq LLM parse	Introducere manuală	MVP
Categorii custom	User își definește categoriile proprii	MVP
Criptare date	AES-GCM app-level	MVP
Vizibilitate user/grup	Fiecare user → proprii cheltuieli	MVP
Export CSV	Export filtrat după dată/categorie	v2


⸻

🧭 Etape de dezvoltare (Timeline)

Etapa 1: Infrastructură de bază
	•	Docker + FastAPI + Postgres
	•	Auth + binding Telegram ID
	•	Migrations + models SQLAlchemy

Etapa 2: Integrare Groq AI
	•	Endpointuri pentru image/voice/manual
	•	Integrare API Groq → return JSON parsed

Etapa 3: Categorii custom
	•	CRUD categorii + UI simplu (bot commands sau REST).

Etapa 4: Criptare + vizibilitate
	•	Implementare AES layer + verificare permisiuni.

⸻

🧠 Prompt Groq AI (exemplu conceptual)

Prompt text
„Analizează următorul conținut (text, voce sau imagine) și returnează un JSON structurat cu detalii despre cheltuială. Normalizează sumele și formatele, corectează greșelile, și mapează categoria în una dintre: [liste din DB ale user-ului].
Output format: { amount, currency, vendor, purchase_date, category, items[], confidence }.”

⸻

