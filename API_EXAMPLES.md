# API Usage Examples

Quick reference for testing all endpoints with `curl`.

## Base URL
```
http://localhost:8000
```

## Health Check

```bash
curl http://localhost:8000/api/v1/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "service": "expense-bot-ai"
}
```

---

## Expenses

### 1. Manual Text Input

```bash
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Am cumpărat 2 cafele la Starbucks, 50 lei"
  }'
```

Alternative examples:
```bash
# English
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{"text": "Bought groceries at Kaufland for 250 MDL"}'

# Romanian with details
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{"text": "Taxi de la aeroport, 180 lei"}'
```

Expected response:
```json
{
  "status": "success",
  "expense_id": "123e4567-e89b-12d3-a456-426614174000",
  "data": {
    "amount": 50.0,
    "currency": "MDL",
    "vendor": "Starbucks",
    "purchase_date": "2025-11-03",
    "category": "Food",
    "items": [
      {"name": "Coffee", "qty": 2, "price": 25.0}
    ],
    "notes": "Manual entry",
    "language": "ro",
    "confidence": 0.92
  }
}
```

### 2. Upload Receipt Photo

```bash
curl -X POST "http://localhost:8000/api/v1/expenses/photo" \
  -F "file=@/path/to/receipt.jpg"
```

Supported formats: `.jpg`, `.jpeg`, `.png`

### 3. Upload Voice Message

```bash
curl -X POST "http://localhost:8000/api/v1/expenses/voice" \
  -F "file=@/path/to/audio.m4a"
```

Supported formats: `.m4a`, `.mp3`, `.ogg`, `.wav`, `.mp4`

### 4. List All Expenses

```bash
curl http://localhost:8000/api/v1/expenses
```

With pagination:
```bash
curl "http://localhost:8000/api/v1/expenses?skip=0&limit=20"
```

Expected response:
```json
{
  "expenses": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "owner_user_id": "00000000-0000-0000-0000-000000000001",
      "source": "manual",
      "amount": 50.0,
      "currency": "MDL",
      "vendor": null,
      "purchase_date": "2025-11-03",
      "category_id": null,
      "ai_confidence": 0.92,
      "created_at": "2025-11-03T10:30:00Z"
    }
  ],
  "total": 1
}
```

---

## Categories

### 1. Create Category

```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Groceries",
    "color": "#4CAF50",
    "icon": "🛒",
    "is_default": false
  }'
```

More examples:
```bash
# Transport category
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Transport", "color": "#2196F3", "icon": "🚗"}'

# Food category
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Food", "color": "#FF9800", "icon": "🍔"}'

# Entertainment
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Entertainment", "color": "#E91E63", "icon": "🎬"}'
```

Expected response:
```json
{
  "id": "456e7890-e89b-12d3-a456-426614174000",
  "user_id": "00000000-0000-0000-0000-000000000001",
  "name": "Groceries",
  "color": "#4CAF50",
  "icon": "🛒",
  "is_default": false
}
```

### 2. List All Categories

```bash
curl http://localhost:8000/api/v1/categories
```

Expected response:
```json
[
  {
    "id": "456e7890-e89b-12d3-a456-426614174000",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "name": "Groceries",
    "color": "#4CAF50",
    "icon": "🛒",
    "is_default": false
  },
  {
    "id": "789e0123-e89b-12d3-a456-426614174000",
    "user_id": "00000000-0000-0000-0000-000000000001",
    "name": "Transport",
    "color": "#2196F3",
    "icon": "🚗",
    "is_default": false
  }
]
```

### 3. Get Single Category

```bash
curl http://localhost:8000/api/v1/categories/456e7890-e89b-12d3-a456-426614174000
```

### 4. Update Category

```bash
curl -X PUT "http://localhost:8000/api/v1/categories/456e7890-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Supermarket",
    "color": "#8BC34A",
    "icon": "🏪"
  }'
```

Partial update (only name):
```bash
curl -X PUT "http://localhost:8000/api/v1/categories/456e7890-e89b-12d3-a456-426614174000" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

### 5. Delete Category

```bash
curl -X DELETE http://localhost:8000/api/v1/categories/456e7890-e89b-12d3-a456-426614174000
```

Expected response:
```json
{
  "status": "success",
  "message": "Category 'Groceries' deleted successfully"
}
```

---

## Authentication (Placeholder)

### Bind Telegram Account

```bash
curl -X POST "http://localhost:8000/auth/telegram_bind" \
  -H "Content-Type: application/json" \
  -d '{
    "telegram_user_id": 123456789,
    "username": "john_doe",
    "display_name": "John Doe"
  }'
```

**Note**: This endpoint exists but is not yet implemented. Returns placeholder response.

---

## Testing Workflow

### Complete Flow Example

1. **Create categories first:**
```bash
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Food", "color": "#FF9800", "icon": "🍔"}'

curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Transport", "color": "#2196F3", "icon": "🚗"}'
```

2. **Add expenses with text:**
```bash
curl -X POST "http://localhost:8000/api/v1/expenses/manual" \
  -H "Content-Type: application/json" \
  -d '{"text": "Lunch at restaurant, 120 MDL"}'
```

3. **List all expenses:**
```bash
curl http://localhost:8000/api/v1/expenses
```

4. **List all categories:**
```bash
curl http://localhost:8000/api/v1/categories
```

---

## Error Handling

### Invalid Request (400)
```bash
curl -X POST "http://localhost:8000/api/v1/expenses/photo" \
  -F "file=@document.pdf"
```

Response:
```json
{
  "detail": "File must be an image"
}
```

### Not Found (404)
```bash
curl http://localhost:8000/api/v1/categories/invalid-uuid
```

Response:
```json
{
  "detail": "Category not found"
}
```

### Duplicate Category (400)
```bash
# Create category twice with same name
curl -X POST "http://localhost:8000/api/v1/categories" \
  -H "Content-Type: application/json" \
  -d '{"name": "Food"}'

# Second call returns:
{
  "detail": "Category 'Food' already exists for this user"
}
```

---

## Notes

- All endpoints currently use hardcoded `user_id`: `00000000-0000-0000-0000-000000000001`
- Authentication is not yet implemented - all requests are "authenticated" as the default user
- Groq API calls are made in real-time - responses may take 2-5 seconds
- File uploads are stored temporarily and cleaned up after processing
- All sensitive data (vendor, json_data) is encrypted in the database

---

## Interactive API Documentation

For a better testing experience, use the built-in Swagger UI:

**http://localhost:8000/docs**

This provides:
- Interactive request/response testing
- Schema validation
- Example values
- Try it out functionality
