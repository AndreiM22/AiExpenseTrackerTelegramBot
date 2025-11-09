"""
Telegram Bot Command Handlers
"""
from sqlalchemy.orm import Session
from app.bot.telegram_bot import telegram_bot
from app.models.user import User
from app.models.category import Category
from app.models.expense import Expense
from app.services.groq_client import groq_client
from app.utils.crypto import encrypt_data
from app.utils.qr_decoder import decode_qr_codes
from datetime import datetime
from typing import Any, Optional, Tuple
import uuid

CATEGORY_KEYWORDS = {
    "Mâncare & Restaurante": [
        "lapte", "pui", "carne", "banan", "morcov", "ceapa", "ulei", "oua",
        "iaurt", "smantana", "fruct", "legum", "cafea", "paine", "covrig",
        "branza", "lavas", "drojdie", "cartofi", "pere", "mere", "dorada",
        "usturoi", "radacina", "patrunjel", "marar", "cotlet", "bors", "apio",
        "piept", "smântână", "covrigei", "lavas", "petrunjel", "chifla",
        "gambe", "crema", "frisca", "lapte", "laptele", "salată", "legume"
    ],
    "Cumpărături": [
        "detergent", "sapun", "servetel", "hartie", "plastic",
        "baterie", "cosmet", "covor", "electronic", "lamp", "articol casnic",
        "sacosa", "odorizant"
    ],
    "Sănătate": ["vitamin", "farmacie", "medical", "pastila", "supliment", "medicament"],
    "Utilități & Locuință": ["factura", "energie", "gaz", "apa", "electric", "chir", "intretinere"],
    "Transport": ["benzina", "diesel", "taxi", "uber", "transport", "autobuz", "masina", "motorina"],
    "Distracție & Timp liber": ["cinema", "joc", "spectacol", "bilete", "cadou", "hobby", "concert"],
}


async def handle_start(chat_id: int, user_data: dict, db: Session):
    """Handle /start command"""

    # Get or create user
    telegram_user_id = user_data.get("id")
    username = user_data.get("username")
    first_name = user_data.get("first_name", "")
    last_name = user_data.get("last_name", "")
    display_name = f"{first_name} {last_name}".strip() or username

    user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()

    if not user:
        user = User(
            id=str(uuid.uuid4()),
            username=username,
            display_name=display_name,
            telegram_user_id=telegram_user_id
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create default categories
        default_categories = [
            {"name": "Mâncare & Restaurante", "color": "#FF9800", "icon": "🍔"},
            {"name": "Transport", "color": "#2196F3", "icon": "🚗"},
            {"name": "Cumpărături", "color": "#E91E63", "icon": "🛍️"},
            {"name": "Distracție & Timp liber", "color": "#9C27B0", "icon": "🎬"},
            {"name": "Sănătate", "color": "#4CAF50", "icon": "💊"},
            {"name": "Utilități & Locuință", "color": "#607D8B", "icon": "💡"},
            {"name": "Alte cheltuieli", "color": "#94A3B8", "icon": "🧾"},
        ]

        for cat_data in default_categories:
            category = Category(
                user_id=user.id,
                name=cat_data["name"],
                color=cat_data["color"],
                icon=cat_data["icon"],
                is_default=True
            )
            db.add(category)

        db.commit()

        welcome_text = f"""
🎉 <b>Bine ai venit la Expense Bot AI!</b>

Salut {display_name}! Sunt aici să te ajut să-ți urmărești cheltuielile automat folosind AI.

<b>🚀 Cum funcționează:</b>

📸 <b>Fotografie bonuri</b>
- Trimite-mi o poză cu bonul fiscal
- Voi extrage automat suma, vendor-ul și produsele

🎤 <b>Mesaje vocale</b>
- Spune "Am cheltuit 50 lei pe cafea"
- Voi procesa și salva cheltuiala

✍️ <b>Text simplu</b>
- Scrie: "Taxi 120 lei"
- Voi înțelege și categoriza

<b>📊 Categorii create:</b>
{chr(10).join([f"{cat['icon']} {cat['name']}" for cat in default_categories])}

<b>💡 Comenzi disponibile:</b>
/start - Mesaj de bun venit
/categories - Vezi categoriile tale
/expenses - Vezi ultimele cheltuieli
/stats - Statistici cheltuieli
/help - Ajutor

<b>Trimite prima cheltuială și începem! 🎯</b>
"""
    else:
        welcome_text = f"""
👋 <b>Salut din nou, {display_name}!</b>

Sunt gata să-ți urmăresc cheltuielile!

<b>💡 Trimite:</b>
📸 Poză cu bon
🎤 Mesaj vocal
✍️ Text simplu

<b>Comenzi:</b>
/categories - Categorii
/expenses - Cheltuieli
/stats - Statistici
/help - Ajutor
"""

    await telegram_bot.send_message(chat_id, welcome_text)


async def handle_help(chat_id: int):
    """Handle /help command"""
    help_text = """
<b>📱 Expense Bot AI - Ghid de utilizare</b>

<b>🎯 Cum să adaugi cheltuieli:</b>

1️⃣ <b>Fotografie bon</b>
   Trimite o poză cu bonul fiscal
   ✅ Extrag automat: suma, vendor, produse

2️⃣ <b>Mesaj vocal</b>
   Spune: "Am cheltuit X lei pe Y"
   ✅ Transcriu și procesez

3️⃣ <b>Text simplu</b>
   Scrie: "Cafea 45 MDL"
   ✅ Înțeleg și categorisez

<b>📊 Comenzi:</b>
/start - Mesaj de bun venit
/categories - Vezi/gestionează categorii
/expenses - Ultimele cheltuieli
/stats - Statistici și rapoarte
/help - Acest mesaj

<b>💡 Exemple:</b>
• "Taxi la aeroport 120 lei"
• "Cumpărături: lapte 25, pâine 15"
• "Restaurant 250 MDL cu prietenii"

<b>AI-ul înțelege:</b>
✅ Românește și Engleză
✅ MDL, EUR, USD, RON
✅ Date și locații
✅ Multiple produse

<b>Începe acum! 🚀</b>
"""
    await telegram_bot.send_message(chat_id, help_text)


async def handle_categories(chat_id: int, user_id: str, db: Session):
    """Handle /categories command with management buttons"""
    categories = db.query(Category).filter(Category.user_id == user_id).all()

    if not categories:
        text = """
📂 <b>Nu ai categorii create încă</b>

Voi crea automat categorii când adaugi prima cheltuială!

💡 Sau folosește: /add_category Nume Categorie
"""
        await telegram_bot.send_message(chat_id, text)
    else:
        text = "<b>📂 Categoriile tale:</b>\n\n"
        for cat in categories:
            default_badge = " 🔒" if cat.is_default else ""
            text += f"{cat.icon} <b>{cat.name}</b>{default_badge}\n"

        text += f"\n<i>Total: {len(categories)} categorii</i>\n\n"
        text += "💡 <b>Acțiuni:</b>\n• /add_category Nume - Adaugă categorie nouă\n• Apasă pe categorie pentru a o șterge"

        # Create inline keyboard with category buttons
        keyboard_rows = []
        for cat in categories:
            # Only allow deletion of non-default categories
            if not cat.is_default:
                keyboard_rows.append([{
                    "text": f"🗑️ {cat.icon} {cat.name}",
                    "callback_data": f"delete_cat_{cat.id}"
                }])

        if keyboard_rows:
            inline_keyboard = {"inline_keyboard": keyboard_rows}
            await telegram_bot.send_message(chat_id, text, reply_markup=inline_keyboard)
        else:
            await telegram_bot.send_message(chat_id, text)


async def handle_add_category(chat_id: int, user_id: str, category_name: str, db: Session):
    """Handle /add_category command"""
    if not category_name or len(category_name.strip()) == 0:
        text = """
❌ <b>Nume categorie lipsă!</b>

<b>Folosește:</b> /add_category Nume Categorie

<b>Exemple:</b>
• /add_category Sănătate
• /add_category Educație
• /add_category Hobby
"""
        await telegram_bot.send_message(chat_id, text)
        return

    category_name = category_name.strip()

    # Check if category already exists
    existing = db.query(Category).filter(
        Category.user_id == user_id,
        Category.name == category_name
    ).first()

    if existing:
        text = f"❌ Categoria <b>{category_name}</b> există deja!"
        await telegram_bot.send_message(chat_id, text)
        return

    # Get all existing category icons to avoid duplicates
    existing_categories = db.query(Category).filter(Category.user_id == user_id).all()
    used_icons = {cat.icon for cat in existing_categories}

    # Comprehensive icon pool organized by themes
    icon_themes = {
        "food": {
            "keywords": ["mancare", "food", "restaurant", "dining", "cafea", "coffee", "bautura", "drink", "groceries", "alimente"],
            "icons": ["🍕", "🍔", "🍟", "🌮", "🍱", "🍜", "🥗", "🍝", "🥘", "🍲", "☕", "🍺", "🍷", "🥤", "🧃"]
        },
        "transport": {
            "keywords": ["transport", "masina", "car", "taxi", "bus", "autobuz", "benzina", "fuel", "parking"],
            "icons": ["🚗", "🚕", "🚌", "🚎", "🚙", "🚐", "⛽", "🅿️", "🚦", "🛣️"]
        },
        "shopping": {
            "keywords": ["shopping", "cumparaturi", "haine", "clothes", "pantaloni", "fashion", "magazin", "store"],
            "icons": ["🛍️", "👕", "👔", "👗", "👠", "👜", "🎽", "👖", "🧥", "🧢"]
        },
        "health": {
            "keywords": ["sanatate", "health", "doctor", "pharmacy", "farmacie", "medical", "spital", "hospital"],
            "icons": ["💊", "🏥", "⚕️", "💉", "🩺", "🩹", "🧬", "🦷", "👨‍⚕️", "👩‍⚕️"]
        },
        "education": {
            "keywords": ["educatie", "education", "scoala", "school", "university", "universitate", "studii", "curs", "course"],
            "icons": ["📚", "📖", "✏️", "📝", "🎓", "🏫", "📐", "🖊️", "📔", "📕"]
        },
        "entertainment": {
            "keywords": ["entertainment", "distractie", "hobby", "film", "movie", "cinema", "muzica", "music", "joc", "game"],
            "icons": ["🎮", "🎬", "🎵", "🎸", "🎹", "🎭", "🎪", "🎨", "🎯", "🎲"]
        },
        "sports": {
            "keywords": ["sport", "fitness", "gym", "sala", "fotbal", "football", "baschet", "basketball"],
            "icons": ["⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏋️", "🚴", "🏊", "🤸"]
        },
        "home": {
            "keywords": ["casa", "home", "chirie", "rent", "utilities", "utilitati", "electric", "apa", "water", "gaz"],
            "icons": ["🏠", "🏡", "🔑", "🚪", "🛋️", "🛏️", "🚿", "💡", "🔌", "🧹"]
        },
        "family": {
            "keywords": ["familie", "family", "copii", "kids", "children", "baby", "bebelus"],
            "icons": ["👨‍👩‍👧", "👨‍👩‍👧‍👦", "👶", "🧒", "👪", "💑", "💏", "👫", "👬", "👭"]
        },
        "gifts": {
            "keywords": ["cadouri", "gifts", "prezent", "present", "aniversare", "birthday"],
            "icons": ["🎁", "🎀", "🎉", "🎊", "🎈", "🎂", "🧧", "💝", "🌹", "💐"]
        },
        "pets": {
            "keywords": ["animale", "pets", "caine", "dog", "pisica", "cat", "veterinar", "vet"],
            "icons": ["🐾", "🐕", "🐈", "🐶", "🐱", "🐕‍🦺", "🐩", "🐈‍⬛", "🦮", "🐇"]
        },
        "travel": {
            "keywords": ["vacanta", "vacation", "travel", "calatorie", "zbor", "flight", "hotel", "turism"],
            "icons": ["✈️", "🛫", "🛬", "🏖️", "🗺️", "🧳", "🎒", "🏨", "🗼", "🏰"]
        },
        "tech": {
            "keywords": ["tech", "tehnologie", "computer", "calculator", "laptop", "phone", "telefon", "software", "gadget", "server"],
            "icons": ["💻", "🖥️", "⌨️", "🖱️", "📱", "📲", "💾", "💿", "📀", "🖨️"]
        },
        "beauty": {
            "keywords": ["beauty", "frumusete", "cosmetica", "coafura", "hair", "salon", "machiaj", "makeup"],
            "icons": ["💄", "💅", "💇", "💆", "🧴", "🧼", "🧽", "🪒", "✂️", "💈"]
        },
        "finance": {
            "keywords": ["finance", "banca", "bank", "investitie", "investment", "asigurare", "insurance"],
            "icons": ["💰", "💵", "💴", "💶", "💷", "💳", "💸", "🏦", "📊", "📈"]
        },
        "work": {
            "keywords": ["work", "munca", "office", "birou", "business", "afacere"],
            "icons": ["💼", "📇", "📋", "📁", "📂", "🗂️", "📌", "📎", "🖇️", "✒️"]
        }
    }

    # Function to find best icon match
    def find_unique_icon(category_name_lower: str, used_icons: set) -> str:
        # Try to match theme based on keywords
        matched_themes = []
        for theme_name, theme_data in icon_themes.items():
            for keyword in theme_data["keywords"]:
                if keyword in category_name_lower:
                    matched_themes.append((theme_name, theme_data["icons"]))
                    break

        # Try matched themes first
        for theme_name, icons in matched_themes:
            for icon in icons:
                if icon not in used_icons:
                    return icon

        # If no match or all matched icons used, try all themes
        for theme_name, theme_data in icon_themes.items():
            for icon in theme_data["icons"]:
                if icon not in used_icons:
                    return icon

        # Fallback to generic unused icons
        generic_icons = ["📁", "📦", "🔖", "🏷️", "⭐", "🔵", "🟢", "🟡", "🟠", "🟣"]
        for icon in generic_icons:
            if icon not in used_icons:
                return icon

        # Last resort - return a random emoji (this should rarely happen)
        return "📌"

    icon = find_unique_icon(category_name.lower(), used_icons)

    # Create new category
    new_category = Category(
        user_id=user_id,
        name=category_name,
        color="#808080",  # gray default
        icon=icon,
        is_default=False
    )

    db.add(new_category)
    db.commit()
    db.refresh(new_category)

    text = f"""
✅ <b>Categorie adăugată cu succes!</b>

{icon} <b>{category_name}</b>

Acum poți folosi această categorie pentru cheltuieli!
"""
    await telegram_bot.send_message(chat_id, text)


async def handle_expenses(chat_id: int, user_id: str, db: Session):
    """Handle /expenses command - show recent expenses"""
    expenses = db.query(Expense).filter(
        Expense.owner_user_id == user_id
    ).order_by(Expense.created_at.desc()).limit(10).all()

    if not expenses:
        text = """
📊 <b>Nu ai cheltuieli înregistrate încă</b>

Trimite-mi:
📸 O poză cu bonul
🎤 Un mesaj vocal
✍️ Sau scrie direct suma
"""
    else:
        text = "<b>📊 Ultimele 10 cheltuieli:</b>\n\n"

        total = 0
        for exp in expenses:
            # Skip expenses with null amount
            if exp.amount is None:
                continue

            date_str = exp.purchase_date.strftime("%d.%m.%Y") if exp.purchase_date else "N/A"
            source_icon = {"photo": "📸", "voice": "🎤", "manual": "✍️"}.get(exp.source, "📝")

            vendor_text = ""
            if exp.vendor:
                try:
                    from app.utils.crypto import crypto_service
                    vendor_text = f" - {crypto_service.decrypt_data(exp.vendor)}"
                except:
                    pass

            text += f"{source_icon} <b>{exp.amount:.2f} {exp.currency}</b>{vendor_text}\n"
            text += f"   📅 {date_str}\n\n"

            if exp.currency == "MDL":
                total += float(exp.amount)

        if total > 0:
            text += f"<b>💰 Total (MDL): {total:.2f}</b>"

    await telegram_bot.send_message(chat_id, text)


async def handle_text_expense(chat_id: int, user_id: str, text: str, db: Session):
    """Handle text message as expense"""

    # Preload categories for this user (used by both SFS and AI flows)
    categories = db.query(Category).filter(Category.user_id == user_id).all()
    category_names = [cat.name for cat in categories]

    # Check if text contains SFS receipt link
    if 'mev.sfs.md/receipt-verifier' in text:
        from app.services.sfs_scraper import sfs_scraper

        await telegram_bot.send_message(chat_id, "🧾 Procesez bon fiscal SFS Moldova...")

        try:
            # Extract URL from text
            import re
            url_pattern = r'https?://mev\.sfs\.md/receipt-verifier/[^\s]+'
            match = re.search(url_pattern, text)

            if match:
                qr_url = match.group(0)

                # Parse SFS receipt
                parsed_data = await sfs_scraper.parse_qr_url(qr_url)

                # Continue with standard expense creation...
                # (same code as below)
            else:
                await telegram_bot.send_message(chat_id, "❌ Link SFS invalid. Te rog trimite link-ul complet.")
                return

        except Exception as e:
            error_text = f"""
❌ <b>Eroare la procesarea bonului SFS</b>

Nu am putut prelua datele de pe site-ul SFS.

<i>Error: {str(e)}</i>
"""
            await telegram_bot.send_message(chat_id, error_text)
            return
    else:
        # Send "typing" indicator
        await telegram_bot.send_message(chat_id, "🤖 Procesez cheltuiala...")

    try:
        if 'parsed_data' not in locals():
            parsed_data = await groq_client.parse_text(text, category_names)
            parsed_data = _apply_category_mapping(parsed_data, category_names)

        # Store in pending cache and ask for confirmation
        from app.bot.pending_cache import pending_cache

        # Check if we have multiple items with categories (split into separate expenses)
        items = parsed_data.get('items', [])
        has_multiple_items = len(items) > 1

        if has_multiple_items:
            # Multiple items - will create separate expenses for each
            confirmation_id = pending_cache.store(user_id, parsed_data, chat_id)

            # Parse date for display
            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            # Build detailed list with categories
            items_detail = ""
            for idx, item in enumerate(items, 1):
                item_name = item.get('name', 'Unknown')
                qty, unit_price, line_total = _item_pricing(item)
                qty_present = item.get('qty') is not None
                item_category = item.get('category', parsed_data.get('category', 'N/A'))

                # Validate item category
                if item_category and category_names:
                    if item_category not in category_names:
                        # Find closest match
                        item_lower = item_category.lower()
                        best_match = None
                        for cat_name in category_names:
                            if item_lower in cat_name.lower() or cat_name.lower() in item_lower:
                                best_match = cat_name
                                break
                        if not best_match:
                            best_match = category_names[0] if category_names else "Uncategorized"
                        item['category'] = best_match
                        item_category = best_match

                amount_value = line_total if line_total is not None else (unit_price or 0.0)
                detail_line = f"{idx}. <b>{item_name}</b> - {amount_value:.2f} {parsed_data.get('currency', 'MDL')}"
                if qty_present and unit_price is not None and qty and qty > 1:
                    detail_line += f" <i>({qty:g} x {unit_price:.2f})</i>"
                items_detail += detail_line + "\n"
                items_detail += f"   📂 {item_category}\n\n"

            confirmation_text = f"""
❓ <b>Confirmi {len(items)} cheltuieli separate?</b>

📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}
💰 <b>Total:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}

<b>📝 Cheltuieli care vor fi create:</b>
{items_detail}
⚠️ <i>Fiecare produs va fi salvat ca cheltuială separată!</i>
"""

        else:
            # Single item or no items - standard flow
            confirmation_id = pending_cache.store(user_id, parsed_data, chat_id)

            vendor_str = f"\n🏪 <b>Vendor:</b> {parsed_data.get('vendor')}" if parsed_data.get('vendor') else ""
            category_str = f"\n📂 <b>Categorie:</b> {parsed_data.get('category')}" if parsed_data.get('category') else ""

            confidence_icon = "🎯" if parsed_data.get('confidence', 0) > 0.8 else "⚠️"

            # Parse date for display
            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            confirmation_text = f"""
❓ <b>Confirmi cheltuiala?</b>

💰 <b>Sumă:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}{vendor_str}{category_str}
📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}

{confidence_icon} <i>Confidence: {int(parsed_data.get('confidence', 0) * 100)}%</i>
"""

        # Create inline keyboard with DA/NU buttons
        inline_keyboard = {
            "inline_keyboard": [
                [
                    {"text": "✅ DA", "callback_data": f"confirm_{confirmation_id}"},
                    {"text": "❌ NU", "callback_data": f"cancel_{confirmation_id}"}
                ]
            ]
        }

        await telegram_bot.send_message(chat_id, confirmation_text, reply_markup=inline_keyboard)

    except Exception as e:
        error_text = f"""
❌ <b>Eroare la procesare</b>

Nu am putut procesa cheltuiala. Te rog încearcă din nou.

<b>Exemple:</b>
• "Cafea 50 lei"
• "Taxi 120 MDL"
• "Cumpărături 200"

<i>Error: {str(e)}</i>
"""
        await telegram_bot.send_message(chat_id, error_text)


async def handle_stats(chat_id: int, user_id: str, db: Session):
    """Handle /stats command with detailed breakdown"""

    # Get all expenses
    expenses = db.query(Expense).filter(Expense.owner_user_id == user_id).all()

    if not expenses:
        text = "📊 Nu ai cheltuieli înregistrate încă!"
        await telegram_bot.send_message(chat_id, text)
        return

    # Calculate stats (skip expenses with null amount)
    from datetime import datetime, timedelta
    from collections import defaultdict
    from app.utils.crypto import crypto_service

    valid_expenses = [exp for exp in expenses if exp.amount is not None]

    if not valid_expenses:
        text = "📊 Nu ai cheltuieli valide înregistrate!"
        await telegram_bot.send_message(chat_id, text)
        return

    now = datetime.now()
    first_day_of_month = now.replace(day=1)
    first_day_of_week = now - timedelta(days=now.weekday())

    # Total stats
    total_mdl = sum(float(exp.amount) for exp in valid_expenses if exp.currency == "MDL")
    total_count = len(valid_expenses)

    # Month stats
    month_expenses = [exp for exp in valid_expenses
                     if exp.created_at and exp.created_at >= first_day_of_month]
    month_total = sum(float(exp.amount) for exp in month_expenses if exp.currency == "MDL")

    # Week stats
    week_expenses = [exp for exp in valid_expenses
                    if exp.created_at and exp.created_at >= first_day_of_week]
    week_total = sum(float(exp.amount) for exp in week_expenses if exp.currency == "MDL")

    # Daily average (based on days since first expense)
    if valid_expenses:
        oldest = min(exp.created_at for exp in valid_expenses if exp.created_at)
        days_tracked = (now - oldest).days + 1
        daily_avg = total_mdl / days_tracked if days_tracked > 0 else 0
    else:
        daily_avg = 0

    # Category breakdown
    category_totals = defaultdict(float)
    for exp in valid_expenses:
        if exp.currency == "MDL" and exp.json_data:
            try:
                data = crypto_service.decrypt_data(exp.json_data)
                import json
                parsed = json.loads(data)
                category = parsed.get("category", "Necategorizat")
                category_totals[category] += float(exp.amount)
            except:
                category_totals["Necategorizat"] += float(exp.amount)

    # Sort categories by total (descending)
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)

    # Build detailed expense list (last 5)
    expense_list = ""
    for exp in sorted(valid_expenses, key=lambda x: x.created_at, reverse=True)[:5]:
        date_str = exp.created_at.strftime("%d.%m") if exp.created_at else "?"
        vendor = ""
        if exp.vendor:
            try:
                vendor = crypto_service.decrypt_data(exp.vendor)
                vendor = f" - {vendor[:15]}" if len(vendor) > 15 else f" - {vendor}"
            except:
                pass
        expense_list += f"  • {date_str}: {exp.amount:.0f} MDL{vendor}\n"

    # Build response
    text = f"""
📊 <b>Statistici Detaliate</b>

💰 <b>REZUMAT:</b>
   Total: {total_mdl:.2f} MDL ({total_count} cheltuieli)
   Medie/zi: {daily_avg:.2f} MDL

📅 <b>PERIOADA:</b>
   Săptămâna: {week_total:.2f} MDL ({len(week_expenses)} chelt.)
   Luna: {month_total:.2f} MDL ({len(month_expenses)} chelt.)

📂 <b>PE CATEGORII:</b>
"""

    for category, total in sorted_categories[:5]:
        percentage = (total / total_mdl * 100) if total_mdl > 0 else 0
        text += f"   • {category}: {total:.0f} MDL ({percentage:.0f}%)\n"

    text += f"""
📝 <b>ULTIMELE 5 CHELTUIELI:</b>
{expense_list}
<i>Actualizat: {now.strftime('%d.%m.%Y %H:%M')}</i>
"""

    await telegram_bot.send_message(chat_id, text)


async def handle_photo_expense(chat_id: int, user_id: str, photo_data: list, db: Session):
    """Handle photo receipt by scanning QR code for SFS link"""

    import tempfile
    import os
    from app.services.sfs_scraper import sfs_scraper

    if not photo_data:
        await telegram_bot.send_message(chat_id, "❌ Nu am primit imaginea. Te rog să o retrimiți.")
        return

    await telegram_bot.send_message(chat_id, "📸 Analizez fotografia pentru codul QR...")

    # Telegram trimite mai multe dimensiuni; folosim varianta cu rezoluție mai mare
    file_id = photo_data[-1]["file_id"]

    try:
        categories = db.query(Category).filter(Category.user_id == user_id).all()
        category_names = [cat.name for cat in categories]

        file_info = await telegram_bot.get_file(file_id)
        file_path = file_info["result"]["file_path"]
        file_content = await telegram_bot.download_file(file_path)

        with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        try:
            qr_values = decode_qr_codes(temp_path)
        finally:
            os.unlink(temp_path)

        if not qr_values:
            await telegram_bot.send_message(
                chat_id,
                "❌ Nu am găsit niciun cod QR în această poză. "
                "Te rog să scanezi QR-ul cu telefonul și să îmi trimiți link-ul."
            )
            return
        else:
            debug_text = "🔍 Am detectat următoarele coduri QR (debug):\n" + "\n".join(
                f"- {val}" for val in qr_values
            )
            await telegram_bot.send_message(chat_id, debug_text)

        sfs_link = None
        for value in qr_values:
            lower_val = value.lower()
            if "mev.sfs.md" in lower_val:
                candidate = value.strip()
                if not candidate.startswith("http"):
                    candidate = f"https://{candidate.lstrip('/')}"
                sfs_link = candidate
                break

        if not sfs_link:
            await telegram_bot.send_message(
                chat_id,
                "⚠️ Am găsit un cod QR, dar nu pare să fie de la SFS Moldova.\n"
                "Te rog trimite link-ul SFS sau descrie cheltuiala în text."
            )
            return

        if not sfs_link.startswith("http"):
            sfs_link = f"https://{sfs_link.lstrip('/')}"

        await telegram_bot.send_message(chat_id, "🧾 Cod QR SFS detectat. Procesez bonul oficial...")

        try:
            parsed_data = await sfs_scraper.parse_qr_url(sfs_link)
            parsed_data = _apply_category_mapping(parsed_data, category_names)
        except Exception as e:
            await telegram_bot.send_message(
                chat_id,
                f"❌ Nu am putut prelua datele SFS din QR.\n<i>Error: {str(e)}</i>"
            )
            return

        # Refolosim fluxul standard după ce parsed_data este setat
        from app.bot.pending_cache import pending_cache

        items = parsed_data.get('items', [])
        has_multiple_items = len(items) > 1

        vendor_metadata = _vendor_metadata(parsed_data)

        if has_multiple_items:
            confirmation_id = pending_cache.store(user_id, parsed_data, chat_id)

            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            items_detail = ""
            for idx, item in enumerate(items, 1):
                item_name = item.get('name', 'Unknown')
                qty, unit_price, line_total = _item_pricing(item)
                qty_present = item.get('qty') is not None
                item_category = item.get('category', parsed_data.get('category', 'N/A'))

                if item_category and category_names:
                    if item_category not in category_names:
                        item_lower = item_category.lower()
                        best_match = None
                        for cat_name in category_names:
                            if item_lower in cat_name.lower() or cat_name.lower() in item_lower:
                                best_match = cat_name
                                break
                        if not best_match:
                            best_match = category_names[0] if category_names else "Fără categorie"
                        item['category'] = best_match
                        item_category = best_match

                amount_value = line_total if line_total is not None else (unit_price or 0.0)
                detail_line = f"{idx}. <b>{item_name}</b> - {amount_value:.2f} {parsed_data.get('currency', 'MDL')}"
                if qty_present and unit_price is not None and qty and qty > 1:
                    detail_line += f" <i>({qty:g} x {unit_price:.2f})</i>"
                items_detail += detail_line + "\n"
                items_detail += f"   📂 {item_category}\n\n"

            confirmation_text = f"""
❓ <b>Confirmi {len(items)} cheltuieli separate?</b>

📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}
💰 <b>Total:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}

{items_detail}

👉 Alege o opțiune de mai jos pentru a continua.
"""
            inline_keyboard = {
                "inline_keyboard": [
                    [
                        {"text": "✅ Confirmă", "callback_data": f"confirm_{confirmation_id}"},
                        {"text": "❌ Renunță", "callback_data": f"cancel_{confirmation_id}"}
                    ]
                ]
            }
            await telegram_bot.send_message(chat_id, confirmation_text, reply_markup=inline_keyboard)
            return

        else:
            # Un singur total -> creăm cheltuiala direct
            encrypted_json = encrypt_data(parsed_data)
            encrypted_vendor = encrypt_data(parsed_data.get("vendor", "")) if parsed_data.get("vendor") else None

            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            matched_category_id = None
            ai_category = parsed_data.get("category")
            if ai_category and category_names:
                for cat in categories:
                    if cat.name == ai_category:
                        matched_category_id = cat.id
                        break

            expense = Expense(
                owner_user_id=user_id,
                source="photo",
                amount=parsed_data.get("amount"),
                currency=parsed_data.get("currency", "MDL"),
                vendor=encrypted_vendor,
                purchase_date=purchase_date,
                category_id=matched_category_id,
                json_data=encrypted_json,
                ai_confidence=parsed_data.get("confidence"),
                **vendor_metadata
            )

            db.add(expense)
            db.commit()

            text = f"""
✅ <b>Bonul SFS a fost procesat!</b>

📍 <b>{parsed_data.get('vendor', 'N/A')}</b>
💰 {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}
📅 {purchase_date.strftime('%d.%m.%Y')}

Categoria: {parsed_data.get('category', 'Fără categorie')}
"""
            await telegram_bot.send_message(chat_id, text)
            return

    except Exception as e:
        await telegram_bot.send_message(
            chat_id,
            f"❌ Nu am reușit să descarc sau să procesez poza.\n<i>Error: {str(e)}</i>"
        )


async def handle_voice_expense(chat_id: int, user_id: str, voice_data: dict, db: Session):
    """Handle voice message"""
    import tempfile
    import os

    await telegram_bot.send_message(chat_id, "🎤 Ascult mesajul vocal...")

    try:
        file_id = voice_data["file_id"]

        # Download voice from Telegram
        file_info = await telegram_bot.get_file(file_id)
        file_path = file_info["result"]["file_path"]
        file_content = await telegram_bot.download_file(file_path)

        # Save temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as temp_file:
            temp_file.write(file_content)
            temp_path = temp_file.name

        try:
            # Parse with Groq AI Speech-to-Text
            parsed_data = await groq_client.parse_voice(temp_path)

            # Encrypt sensitive data
            encrypted_json = encrypt_data(parsed_data)
            encrypted_vendor = encrypt_data(parsed_data.get("vendor", "")) if parsed_data.get("vendor") else None

            # Parse date
            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            # Create expense
            expense = Expense(
                owner_user_id=user_id,
                source="voice",
                amount=parsed_data.get("amount"),
                currency=parsed_data.get("currency", "MDL"),
                vendor=encrypted_vendor,
                purchase_date=purchase_date,
                json_data=encrypted_json,
                ai_confidence=parsed_data.get("confidence")
            )

            db.add(expense)
            db.commit()
            db.refresh(expense)

            # Format response
            vendor_str = f"\n🏪 <b>Vendor:</b> {parsed_data.get('vendor')}" if parsed_data.get('vendor') else ""
            category_str = f"\n📂 <b>Categorie:</b> {parsed_data.get('category')}" if parsed_data.get('category') else ""

            items_str = ""
            if parsed_data.get('items') and len(parsed_data['items']) > 0:
                items_str = "\n\n<b>📝 Produse:</b>\n"
                for item in parsed_data['items']:
                    items_str += f"  • {item.get('name')} - {item.get('price')} {parsed_data.get('currency', 'MDL')}\n"

            confidence_icon = "🎯" if parsed_data.get('confidence', 0) > 0.8 else "⚠️"

            response_text = f"""
✅ <b>Mesaj vocal procesat!</b>

💰 <b>Sumă:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}{vendor_str}{category_str}
📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}{items_str}

{confidence_icon} <i>Confidence: {int(parsed_data.get('confidence', 0) * 100)}%</i>
"""

            await telegram_bot.send_message(chat_id, response_text)

        finally:
            # Cleanup temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except Exception as e:
        error_text = f"""
❌ <b>Eroare la procesarea mesajului vocal</b>

Nu am putut înțelege mesajul. Încearcă:
• Vorbește mai clar
• Menționează suma și moneda
• Evită zgomotul de fundal

Sau scrie direct în chat! ✍️

<i>Error: {str(e)}</i>
"""
        await telegram_bot.send_message(chat_id, error_text)


def _apply_category_mapping(parsed_data: dict, category_names: list[str]) -> dict:
    """Ensure overall category and item categories match user's list."""
    if not parsed_data:
        return parsed_data

    if not category_names:
        category_names = []

    def normalize_category(candidate: str, name_hint: str = "") -> str:
        if not category_names:
            return candidate or "Alte cheltuieli"

        if candidate in category_names:
            return candidate

        lower = (candidate or "").lower()
        for cat in category_names:
            cat_lower = cat.lower()
            if lower and (lower in cat_lower or cat_lower in lower):
                return cat

        hint = (name_hint or "").lower()
        if hint:
            for cat in category_names:
                keywords = CATEGORY_KEYWORDS.get(cat, [])
                if any(keyword in hint for keyword in keywords):
                    return cat

        default_cat = category_names[0]
        if "alte cheltuieli" in [c.lower() for c in category_names]:
            default_cat = next(
                c for c in category_names if c.lower() == "alte cheltuieli"
            )
        return default_cat

    parsed_data["category"] = normalize_category(
        parsed_data.get("category"), parsed_data.get("notes", "")
    )

    items = parsed_data.get("items", [])
    if isinstance(items, list):
        for item in items:
            item_name = item.get("name", "")
            item["category"] = normalize_category(
                item.get("category"), item_name
            )

    return parsed_data


def _to_float_value(value: Any) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        cleaned = str(value).replace(",", ".").strip()
        return float(cleaned)
    except (ValueError, TypeError):
        return None


def _item_pricing(item: dict) -> Tuple[Optional[float], Optional[float], Optional[float]]:
    raw_qty = _to_float_value(item.get("qty"))
    qty_for_math = raw_qty if raw_qty is not None and raw_qty > 0 else 1.0
    unit_price = _to_float_value(item.get("price"))
    total = _to_float_value(item.get("total"))

    if total is None and unit_price is not None:
        total = unit_price * qty_for_math
    if unit_price is None and total is not None and qty_for_math:
        unit_price = total / qty_for_math

    return raw_qty if raw_qty is not None else qty_for_math, unit_price, total


def _vendor_metadata(parsed_data: dict) -> dict:
    return {
        "vendor_fiscal_code": parsed_data.get("fiscal_code"),
        "vendor_registration_number": parsed_data.get("registration_number"),
        "vendor_address": parsed_data.get("address"),
    }


async def handle_callback_query(callback_query: dict, db: Session):
    """Handle inline keyboard button callbacks (DA/NU confirmations)"""
    from app.bot.pending_cache import pending_cache
    from app.utils.crypto import encrypt_data

    callback_id = callback_query.get("id")
    callback_data = callback_query.get("data")
    message = callback_query.get("message")
    user_data = callback_query.get("from")

    chat_id = message["chat"]["id"]
    message_id = message["message_id"]
    telegram_user_id = user_data.get("id")

    # Get user from DB
    user = db.query(User).filter(User.telegram_user_id == telegram_user_id).first()
    if not user:
        await telegram_bot.send_message(chat_id, "❌ Utilizator negăsit. Apasă /start")
        return

    try:
        # Parse callback data
        if callback_data.startswith("confirm_"):
            confirmation_id = callback_data.replace("confirm_", "")

            # Retrieve pending expense
            pending = pending_cache.get(confirmation_id)
            if not pending:
                await telegram_bot.send_message(chat_id, "❌ Confirmarea a expirat. Te rog adaugă din nou cheltuiala.")
                return

            parsed_data = pending["parsed_data"]
            categories = db.query(Category).filter(Category.user_id == user.id).all()
            category_names = [cat.name for cat in categories]
            parsed_data = _apply_category_mapping(parsed_data, category_names)
            vendor_metadata = _vendor_metadata(parsed_data)

            # Parse date
            purchase_date = None
            if parsed_data.get("purchase_date"):
                try:
                    purchase_date = datetime.strptime(parsed_data["purchase_date"], "%Y-%m-%d").date()
                except:
                    purchase_date = datetime.now().date()
            else:
                purchase_date = datetime.now().date()

            # Check if multiple items (create separate expenses)
            items = parsed_data.get('items', [])

            if len(items) > 1:
                expenses_created = []

                for item in items:
                    item_name = item.get('name', 'Unknown')
                    qty, unit_price, line_total = _item_pricing(item)
                    qty_present = item.get('qty') is not None
                    item_category = item.get('category', parsed_data.get('category', 'Uncategorized'))
                    amount_value = line_total if line_total is not None else (unit_price or 0.0)
                    normalized_item = dict(item)
                    if qty_present and qty is not None:
                        normalized_item['qty'] = qty
                    if unit_price is not None:
                        normalized_item['price'] = unit_price
                    if amount_value is not None:
                        normalized_item['total'] = amount_value

                    item_data = {
                        "amount": amount_value,
                        "currency": parsed_data.get("currency", "MDL"),
                        "vendor": item_name,
                        "category": item_category,
                        "items": [normalized_item],
                        "purchase_date": parsed_data.get("purchase_date"),
                        "confidence": parsed_data.get("confidence", 0.8),
                        "fiscal_code": parsed_data.get("fiscal_code"),
                        "registration_number": parsed_data.get("registration_number"),
                        "address": parsed_data.get("address"),
                    }

                    encrypted_json = encrypt_data(item_data)
                    encrypted_vendor = encrypt_data(item_name) if item_name else None

                    matched_category_id = None
                    if item_category and categories:
                        for cat in categories:
                            if cat.name == item_category:
                                matched_category_id = cat.id
                                break

                    expense = Expense(
                        owner_user_id=user.id,
                        source="manual",
                        amount=amount_value,
                        currency=parsed_data.get("currency", "MDL"),
                        vendor=encrypted_vendor,
                        purchase_date=purchase_date,
                        category_id=matched_category_id,
                        json_data=encrypted_json,
                        ai_confidence=parsed_data.get("confidence"),
                        **vendor_metadata
                    )

                    db.add(expense)
                    summary_line = f"• {item_name} - {amount_value:.2f} {parsed_data.get('currency', 'MDL')} ({item_category})"
                    if qty_present and unit_price is not None and qty and qty > 1:
                        summary_line += f" [{qty:g} x {unit_price:.2f}]"
                    expenses_created.append(summary_line)

                db.commit()
                pending_cache.delete(confirmation_id)

                expenses_list = "\n".join(expenses_created)
                success_text = f"""
✅ <b>{len(items)} Cheltuieli create cu succes!</b>

📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}

<b>📝 Cheltuieli salvate:</b>
{expenses_list}

💰 <b>Total:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}
"""
                await telegram_bot.send_message(chat_id, success_text)

            else:
                encrypted_json = encrypt_data(parsed_data)
                encrypted_vendor = encrypt_data(parsed_data.get("vendor", "")) if parsed_data.get("vendor") else None

                matched_category_id = None
                if parsed_data.get("category") and categories:
                    for cat in categories:
                        if cat.name == parsed_data["category"]:
                            matched_category_id = cat.id
                            break

                expense = Expense(
                    owner_user_id=user.id,
                    source="manual",
                    amount=parsed_data.get("amount"),
                    currency=parsed_data.get("currency", "MDL"),
                    vendor=encrypted_vendor,
                    purchase_date=purchase_date,
                    category_id=matched_category_id,
                    json_data=encrypted_json,
                    ai_confidence=parsed_data.get("confidence"),
                    **vendor_metadata
                )

                db.add(expense)
                db.commit()
                db.refresh(expense)

                pending_cache.delete(confirmation_id)

                success_text = f"""
✅ <b>Cheltuială confirmată și salvată!</b>

💰 <b>Sumă:</b> {parsed_data.get('amount')} {parsed_data.get('currency', 'MDL')}
📂 <b>Categorie:</b> {parsed_data.get('category', 'N/A')}
📅 <b>Data:</b> {purchase_date.strftime('%d.%m.%Y')}
"""
                await telegram_bot.send_message(chat_id, success_text)

        elif callback_data.startswith("cancel_"):
            confirmation_id = callback_data.replace("cancel_", "")

            # Remove from pending cache
            pending_cache.delete(confirmation_id)

            # Send cancel message
            cancel_text = "❌ <b>Cheltuială anulată</b>\n\nNu a fost salvată în baza de date."
            await telegram_bot.send_message(chat_id, cancel_text)

        elif callback_data.startswith("delete_cat_"):
            # Delete category (with migration if has expenses)
            category_id = callback_data.replace("delete_cat_", "")

            # Get category
            category = db.query(Category).filter(Category.id == category_id).first()
            if not category:
                await telegram_bot.send_message(chat_id, "❌ Categorie negăsită!")
                return

            # Check if category has expenses
            from app.utils.crypto import crypto_service
            import json

            expenses_with_category = []
            all_expenses = db.query(Expense).filter(Expense.owner_user_id == user.id).all()

            for exp in all_expenses:
                if exp.json_data:
                    try:
                        data = crypto_service.decrypt_data(exp.json_data)
                        parsed = json.loads(data)
                        if parsed.get("category") == category.name:
                            expenses_with_category.append(exp)
                    except:
                        pass

            if len(expenses_with_category) > 0:
                # Has expenses - need to migrate
                # Get other categories for selection
                other_categories = db.query(Category).filter(
                    Category.user_id == user.id,
                    Category.id != category_id
                ).all()

                if not other_categories:
                    await telegram_bot.send_message(
                        chat_id,
                        f"❌ Nu poți șterge categoria <b>{category.name}</b> pentru că are {len(expenses_with_category)} cheltuieli și nu există alte categorii!\n\nCreează o categorie nouă mai întâi."
                    )
                    return

                # Show migration options
                text = f"""
⚠️ <b>Categoria {category.icon} {category.name} are {len(expenses_with_category)} cheltuieli!</b>

Alege categoria în care vrei să muți cheltuielile:
"""
                keyboard_rows = []
                for cat in other_categories:
                    keyboard_rows.append([{
                        "text": f"{cat.icon} {cat.name}",
                        "callback_data": f"migrate_{category_id}_to_{cat.id}"
                    }])

                # Add cancel option
                keyboard_rows.append([{
                    "text": "❌ Anulează",
                    "callback_data": f"cancel_delete_{category_id}"
                }])

                inline_keyboard = {"inline_keyboard": keyboard_rows}
                await telegram_bot.send_message(chat_id, text, reply_markup=inline_keyboard)

            else:
                # No expenses - delete directly
                db.delete(category)
                db.commit()

                text = f"✅ Categoria <b>{category.icon} {category.name}</b> a fost ștearsă!"
                await telegram_bot.send_message(chat_id, text)

        elif callback_data.startswith("migrate_"):
            # Migrate expenses from one category to another
            parts = callback_data.replace("migrate_", "").split("_to_")
            if len(parts) != 2:
                await telegram_bot.send_message(chat_id, "❌ Eroare la procesare!")
                return

            old_category_id, new_category_id = parts

            # Get categories
            old_category = db.query(Category).filter(Category.id == old_category_id).first()
            new_category = db.query(Category).filter(Category.id == new_category_id).first()

            if not old_category or not new_category:
                await telegram_bot.send_message(chat_id, "❌ Categorii negăsite!")
                return

            # Migrate all expenses
            from app.utils.crypto import crypto_service
            import json

            all_expenses = db.query(Expense).filter(Expense.owner_user_id == user.id).all()
            migrated_count = 0

            for exp in all_expenses:
                if exp.json_data:
                    try:
                        data = crypto_service.decrypt_data(exp.json_data)
                        parsed = json.loads(data)

                        if parsed.get("category") == old_category.name:
                            # Update category in json_data
                            parsed["category"] = new_category.name
                            exp.json_data = encrypt_data(parsed)
                            migrated_count += 1
                    except:
                        pass

            db.commit()

            # Delete old category
            db.delete(old_category)
            db.commit()

            text = f"""
✅ <b>Migrare finalizată!</b>

{migrated_count} cheltuieli mutate din:
{old_category.icon} <b>{old_category.name}</b>

În:
{new_category.icon} <b>{new_category.name}</b>

Categoria veche a fost ștearsă.
"""
            await telegram_bot.send_message(chat_id, text)

        elif callback_data.startswith("cancel_delete_"):
            await telegram_bot.send_message(chat_id, "❌ Ștergere anulată.")

    except Exception as e:
        import logging
        logging.error(f"Error handling callback: {str(e)}", exc_info=True)
        await telegram_bot.send_message(chat_id, f"❌ Eroare: {str(e)}")
