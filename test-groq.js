// Test script to verify Groq AI Romanian text parsing
import Groq from "groq-sdk";

const groqClient = new Groq({
  apiKey: "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"
});

const categoryContext = "Groceries, Transport, Restaurant, Health, Entertainment";

const testCases = [
  "Am cumpărat pâine 15 lei",
  "Am fost la Linella 50 lei",
  "Cafea 25 lei",
  "Taxi 30 lei",
];

async function testParsing(text) {
  console.log(`\n📝 Testing: "${text}"`);
  console.log("=".repeat(60));

  try {
    const completion = await groqClient.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are an AI that extracts structured expense data from Romanian messages.

IMPORTANT INSTRUCTIONS FOR ROMANIAN TEXT:
- The "vendor" field should be the ITEM PURCHASED or STORE NAME, NOT the verb phrase
- Example: "Am cumpărat pâine 15 lei" → vendor should be "pâine" (bread), NOT "Am"
- Example: "Am fost la Linella 50 lei" → vendor should be "Linella" (store name)
- Example: "Cafea 25 lei" → vendor should be "Cafea" (coffee)
- Ignore Romanian verbs like: "Am cumpărat", "Am fost", "Plătit", etc.

CATEGORY MATCHING:
- Match the expense to one of these categories: ${categoryContext}
- If the item is food/groceries, use "Groceries"
- If the item is transportation (taxi, bus, benzină), use "Transport"
- If the item is restaurant/coffee, use "Restaurant"
- If uncertain, leave category empty

OUTPUT FORMAT:
Respond ONLY with JSON that includes these fields:
{
  "data": {
    "amount": number,
    "currency": string,
    "vendor": string,
    "purchase_date": string (ISO format YYYY-MM-DD),
    "category": string,
    "notes": string
  }
}`,
        },
        { role: "user", content: text },
      ],
    });

    const response = completion.choices?.[0]?.message?.content;
    const parsed = JSON.parse(response);

    console.log("✅ Groq AI Response:");
    console.log(JSON.stringify(parsed, null, 2));

    if (parsed.data) {
      console.log(`\n📊 Vendor: ${parsed.data.vendor}`);
      console.log(`💰 Amount: ${parsed.data.amount} ${parsed.data.currency}`);
      console.log(`🏷️  Category: ${parsed.data.category || "None"}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

async function runTests() {
  console.log("🚀 Testing Groq AI Romanian Text Parsing\n");

  for (const testCase of testCases) {
    await testParsing(testCase);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
  }

  console.log("\n✅ All tests completed!");
}

runTests().catch(console.error);
