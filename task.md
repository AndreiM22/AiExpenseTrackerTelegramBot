

🧱 ETAPA 1: Structura proiectului și infrastructura de bază

🎯 Scop:

Pregătirea mediului, structura codului și baza de date.

⸻

🧩 TASK 1: Configurare proiect și environment

Cod: MVP-001

Descriere:
Creează structura proiectului FastAPI + Postgres + Docker.

Subtasks:
	•	Initializează repo expense-bot-ai.
	•	Creează docker-compose.yml cu servicii:
	•	app (FastAPI)
	•	db (Postgres)
	•	redis (pentru future async tasks)
	•	Adaugă Dockerfile pentru app.
	•	Adaugă .env.example cu variabile:

DATABASE_URL=postgresql://user:pass@db:5432/expensebot
GROQ_API_KEY=...
ENCRYPTION_KEY=...
TELEGRAM_BOT_TOKEN=...


	•	Creează structura directoarelor:

/app
  /api
  /models
  /services
  /utils
  /tasks



⸻

🧩 TASK 2: Modele de bază și migrații

Cod: MVP-002

Descriere:
Creează modelele SQLAlchemy + migrațiile Alembic.

Subtasks:
	•	User, Category, Expense, Group, UserGroup
	•	Rulează alembic init migrations
	•	Creează env.py Alembic pentru DATABASE_URL
	•	Testează migrațiile cu alembic upgrade head

⸻

🧩 TASK 3: Criptare datelor sensibile

Cod: MVP-003

Descriere:
Implementare criptare AES-GCM pentru coloanele sensibile (json_data, vendor etc).

Subtasks:
	•	Creează utils/crypto.py cu funcții encrypt_data() / decrypt_data().
	•	Criptare la salvare în DB.
	•	Decriptare la GET.
	•	Adaugă test unitar cu text cunoscut → criptare/decriptare.

⸻

⚙️ ETAPA 2: Integrare Groq AI

🎯 Scop:

Conectare la Groq API și crearea endpointurilor pentru foto, voce și text.

⸻

🧩 TASK 4: Integrare Groq Client

Cod: MVP-004

Descriere:
Creează un serviciu care comunică cu Groq AI API.

Subtasks:
	•	Creează services/groq_client.py.
	•	Adaugă metode:

def parse_photo(file_path: str) -> dict
def parse_voice(file_path: str) -> dict
def parse_text(text: str, categories: list[str]) -> dict


	•	Conectează prin requests sau httpx cu Authorization: Bearer GROQ_API_KEY.
	•	Adaugă retry și logging.

⸻

🧩 TASK 5: Endpointuri FastAPI pentru fiecare input

Cod: MVP-005

Descriere:
Creează endpointurile REST care folosesc Groq pentru fiecare tip de input.

Subtasks:
	•	POST /api/v1/expenses/photo — primește fișier imagine, apelează parse_photo, salvează rezultatul.
	•	POST /api/v1/expenses/voice — primește fișier audio, apelează parse_voice.
	•	POST /api/v1/expenses/manual — primește text, apelează parse_text.
	•	GET /api/v1/expenses — listează cheltuieli pentru user.
	•	Validează output-ul Groq JSON (amount, currency, vendor, category).

⸻

🧩 TASK 6: Salvare rezultat în DB

Cod: MVP-006

Descriere:
După primirea datelor Groq, se creează un Expense.

Subtasks:
	•	Mapează GroqResponse → ExpenseModel.
	•	Salvează câmpurile amount, currency, vendor, purchase_date, category.
	•	Stochează json_data criptat.
	•	Returnează {"status": "success", "expense_id": "..."}.

⸻

💬 ETAPA 3: Categorii și personalizare utilizator

🎯 Scop:

Permite utilizatorului să-și definească categoriile, pe care Groq AI le folosește la analiză.

⸻

🧩 TASK 7: CRUD categorii custom

Cod: MVP-007

Descriere:
Fiecare user poate adăuga, modifica sau șterge categoriile sale.

Subtasks:
	•	POST /api/v1/categories — adaugă categorie nouă (nume, culoare, icon).
	•	GET /api/v1/categories — listează toate categoriile userului.
	•	PUT /api/v1/categories/{id} — editează.
	•	DELETE /api/v1/categories/{id} — șterge.
	•	Asigură unicitatea numelui per user.

⸻

🧩 TASK 8: Integrare categorii custom cu Groq AI

Cod: MVP-008

Descriere:
La fiecare cerere către Groq, trimite lista categoriilor userului în prompt/context.

Subtasks:
	•	Modifică parse_text / parse_photo / parse_voice pentru a adăuga context:

categories = db.get_user_categories(user_id)
response = groq_client.parse_text(text, categories)


	•	Asigură că dacă modelul returnează o categorie inexistentă, creează una nouă „auto-generated”.

⸻

🔐 ETAPA 4: Securitate, permisiuni și vizibilitate

🎯 Scop:

Izolarea datelor per user + permisiuni pentru grupuri.

⸻

🧩 TASK 9: Sistem de autentificare și sesiune

Cod: MVP-009

Descriere:
Autentificare bazată pe token (JWT) + mapare Telegram ID.

Subtasks:
	•	Endpoint POST /auth/telegram_bind.
	•	Salvare telegram_user_id în tabelul users.
	•	Depends(get_current_user) în toate endpointurile.
	•	JWT expirat după 24h.

⸻

🧩 TASK 10: Permisiuni user/grup

Cod: MVP-010

Descriere:
Fiecare user vede doar cheltuielile proprii; grupurile pot fi definite ulterior.

Subtasks:
	•	Fiecare query de listare cheltuieli → WHERE owner_user_id = current_user.id.
	•	Câmp group_id opțional — dacă există, vizibil doar membrilor acelui grup.
	•	Structură UserGroup cu role = 'member' | 'admin'.

⸻

📊 ETAPA 5: Testare și optimizare

⸻

🧩 TASK 11: Teste unitare și e2e

Cod: MVP-011

Subtasks:
	•	Test pentru encrypt_data/decrypt_data.
	•	Test pentru parse_text() — să returneze JSON complet.
	•	Test endpoint POST /expenses/manual.
	•	Test permisiuni (alt user nu poate accesa alte cheltuieli).
	•	Test categorii custom + integrare cu Groq.

⸻

🧩 TASK 12: Deploy MVP (Docker)

Cod: MVP-012

Subtasks:
	•	Creează Dockerfile.prod.
	•	docker-compose up --build
	•	Healthcheck pentru API (GET /api/v1/health).
	•	Configurează backup automat pentru Postgres (cron).
	•	Documentează setup-ul în README.md.

⸻

🧭 BONUS: ETAPA 6 – Funcționalități Post-MVP

Cod	Descriere
NICE-001	Export CSV pentru o perioadă + categorie
NICE-002	Dashboard web mini (React/Next.js)
NICE-003	Integrare Google Sheets sync
NICE-004	Notificări zilnice cu total cheltuieli


⸻

🧾 EXTRAS: Template GitHub Issue pentru fiecare task

### Task ID: MVP-005 — Endpointuri FastAPI pentru fiecare input

**Scop:**  
Implementarea endpointurilor REST pentru introducerea cheltuielilor din foto, voce și text.

**Cerințe:**
- `/api/v1/expenses/photo` — acceptă imagine, trimite la Groq AI, salvează rezultat.
- `/api/v1/expenses/voice` — acceptă fișier audio, procesează cu Groq AI speech model.
- `/api/v1/expenses/manual` — text liber, normalizează cu Groq AI text model.

**Rezultat:**
Return JSON:
```json
{
  "status": "success",
  "data": {
    "amount": 120.50,
    "currency": "MDL",
    "category": "Food",
    "vendor": "Kaufland"
  }
}

Criterii de acceptare:
	•	Endpointurile validează tipul de fișier.
	•	Groq API răspunde cu JSON structurat.
	•	Cheltuiala se salvează criptat în DB.

