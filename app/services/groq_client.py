import httpx
import logging
import base64
from typing import Optional
from tenacity import retry, stop_after_attempt, wait_exponential
from app.utils.config import settings

logger = logging.getLogger(__name__)


class GroqClient:
    """Client for interacting with Groq AI API"""

    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.base_url = "https://api.groq.com/openai/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _make_request(self, endpoint: str, payload: dict) -> dict:
        """
        Make HTTP request to Groq API with retry logic

        Args:
            endpoint: API endpoint path
            payload: Request payload

        Returns:
            API response as dict
        """
        url = f"{self.base_url}/{endpoint}"

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                logger.error(f"Groq API error: {e.response.status_code} - {e.response.text}")
                raise
            except Exception as e:
                logger.error(f"Groq API request failed: {str(e)}")
                raise

    async def parse_photo(self, file_path: str) -> dict:
        """
        Parse receipt photo using Groq vision model

        Args:
            file_path: Path to image file

        Returns:
            Parsed expense data dict with fields:
            - amount (float)
            - currency (str)
            - vendor (str)
            - purchase_date (str)
            - category (str)
            - items (list)
            - confidence (float)
        """
        logger.info(f"Parsing photo: {file_path}")

        # Read and encode image as base64
        with open(file_path, "rb") as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')

        # Use vision-capable model (llama-3.2-11b-vision-preview)
        payload = {
            "model": "llama-3.2-11b-vision-preview",
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """Analyze this receipt image and extract expense information.
                            Return a JSON object with: amount (number), currency (string),
                            vendor (string), purchase_date (YYYY-MM-DD), category (string),
                            items (array of {name, qty, price}), notes (string),
                            language (string), confidence (0-1 float).
                            If information is unclear, use your best judgment and reflect that in the confidence score."""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_data}"
                            }
                        }
                    ]
                }
            ],
            "temperature": 0.1,
            "max_tokens": 1000
        }

        try:
            response = await self._make_request("chat/completions", payload)
            content = response["choices"][0]["message"]["content"]

            # Parse JSON from response
            import json
            parsed_data = json.loads(content)

            logger.info(f"Photo parsed successfully with confidence: {parsed_data.get('confidence', 'N/A')}")
            return parsed_data

        except Exception as e:
            logger.error(f"Failed to parse photo: {str(e)}")
            raise

    async def parse_voice(self, file_path: str) -> dict:
        """
        Transcribe and parse voice message using Groq speech model

        Args:
            file_path: Path to audio file

        Returns:
            Parsed expense data dict (same format as parse_photo)
        """
        logger.info(f"Parsing voice: {file_path}")

        # Step 1: Transcribe audio using Whisper
        transcription_url = f"{self.base_url}/audio/transcriptions"

        async with httpx.AsyncClient(timeout=60.0) as client:
            with open(file_path, "rb") as f:
                files = {"file": f}
                data = {
                    "model": "whisper-large-v3",
                    "language": "ro",  # Romanian
                    "response_format": "json"
                }
                headers = {"Authorization": f"Bearer {self.api_key}"}

                response = await client.post(transcription_url, files=files, data=data, headers=headers)
                response.raise_for_status()
                transcription = response.json()

        transcribed_text = transcription.get("text", "")
        logger.info(f"Transcribed text: {transcribed_text}")

        # Step 2: Parse transcribed text
        return await self.parse_text(transcribed_text, [])

    async def parse_text(self, text: str, categories: list[str]) -> dict:
        """
        Parse manual text input and extract expense information

        Args:
            text: User's text input
            categories: List of user's custom category names

        Returns:
            Parsed expense data dict (same format as parse_photo)
        """
        logger.info(f"Parsing text: {text[:50]}...")

        categories_text = ", ".join(categories) if categories else "Mâncare & Restaurante, Transport, Cumpărături, Distracție & Timp liber, Utilități & Locuință, Sănătate, Alte cheltuieli"

        category_guidance = (
            "Folosește DOAR aceste categorii exacte și alege-o pe cea mai apropiată pentru fiecare produs.\n"
            "- Mâncare & Restaurante: alimente, băuturi, ingrediente, restaurante, supermarketuri\n"
            "- Cumpărături: produse casnice, igienă, cosmetice, electronice mici, consumabile\n"
            "- Sănătate: medicamente, farmacie, vitamine, suplimente\n"
            "- Utilități & Locuință: facturi, energie, gaz, apă, chirie\n"
            "- Transport: combustibil, taxi, transport public, piese auto\n"
            "- Distracție & Timp liber: evenimente, jocuri, hobby, bilete, cadouri\n"
            "- Alte cheltuieli: doar dacă nu există o potrivire bună în lista de mai sus"
        )

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": f"""Ești un asistent financiar. Extrage cheltuieli și întoarce DOAR JSON valid.

{category_guidance}

Structură JSON obligatorie:
{{
  "amount": număr total,
  "currency": "MDL" (sau moneda găsită),
  "vendor": "string",
  "purchase_date": "YYYY-MM-DD" (default azi),
  "category": "<una din categoriile definite>",
  "items": [
     {{
        "name": "produs",
        "qty": număr,
        "price": număr,
        "category": "<una din categoriile definite>"
     }}
  ],
  "notes": "text",
  "language": "ro",
  "confidence": 0.x
}}

Reguli stricte:
- fiecare items[i].category trebuie să fie exact una dintre categoriile enumerate;
- nu inventa alte denumiri, nu traduce în altă limbă;
- dacă produsul este alimentar, folosește Mâncare & Restaurante etc.;
- dacă nu există potrivire decentă, folosește 'Alte cheltuieli';
- răspunde doar în limba română."""
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            "temperature": 0.2,
            "max_tokens": 800,
            "response_format": {"type": "json_object"}
        }

        try:
            response = await self._make_request("chat/completions", payload)
            content = response["choices"][0]["message"]["content"]

            import json
            parsed_data = json.loads(content)

            logger.info(f"Text parsed successfully: {parsed_data.get('amount')} {parsed_data.get('currency')}")
            return parsed_data

        except Exception as e:
            logger.error(f"Failed to parse text: {str(e)}")
            raise

    async def suggest_category(self, description: str) -> dict:
        """
        Use Groq LLM to suggest a category name, icon, and color.
        """
        palette = [
            "#F97316", "#38BDF8", "#34D399", "#FACC15",
            "#F472B6", "#60A5FA", "#A78BFA", "#FB7185",
            "#FDBA74", "#FDE047", "#10B981", "#94A3B8"
        ]
        palette_text = ", ".join(palette)
        instructions = (
            "Return ONLY valid JSON with keys: name, icon, color. "
            "Name must be written in Romanian and limited to maximum 3 words. "
            "Icon must be a single emoji. "
            "Color must be one of these hex codes (choose the closest match): "
            f"{palette_text}. "
            "If none match well, choose the closest visually pleasing hex from the list. "
            "Do NOT wrap the JSON in markdown, just raw JSON."
        )

        payload = {
            "model": "llama-3.3-70b-versatile",
            "messages": [
                {
                    "role": "system",
                    "content": "You help users define expense categories for a budgeting dashboard."
                },
                {
                    "role": "user",
                    "content": f"{instructions}\n\nDescription: {description}"
                }
            ],
            "temperature": 0.2,
            "max_tokens": 300
        }

        response = await self._make_request("chat/completions", payload)
        content = response["choices"][0]["message"]["content"]

        import json
        try:
            data = json.loads(content)
            name = data.get("name") or "Custom Category"
            icon = data.get("icon") or "🏷️"
            color = data.get("color") or "#10B981"

            if color not in palette:
                color = palette[0]

            return {
                "name": name,
                "icon": icon,
                "color": color
            }
        except Exception:
            logger.warning("Groq category suggestion not JSON, returning fallback.")
            return {
                "name": "Custom Category",
                "icon": "🏷️",
                "color": "#10B981"
            }


# Singleton instance
groq_client = GroqClient()
