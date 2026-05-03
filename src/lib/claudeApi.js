/* Claude API proxy — called from client side via a simple fetch wrapper.
   NOTE: In production, wrap this in a Supabase Edge Function to keep the key server-side.
   For dev/demo, the key is passed directly from .env */

export async function getAISuggestions(transactionSummary) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return getMockSuggestions()
  }

  const prompt = `Analyse this user's spending data for the last 30 days and provide insights.

Transaction Summary:
${JSON.stringify(transactionSummary, null, 2)}

Identify the top 3 unnecessary spend patterns. For each, give a specific, friendly, actionable suggestion to reduce it. 

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
[
  {
    "category": "Category Name",
    "overspend_amount": 1500,
    "suggestion": "Specific actionable tip here",
    "estimated_saving": 500
  }
]`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) throw new Error(`Claude API error: ${response.status}`)
    const data = await response.json()
    const text = data.content[0].text.trim()
    return JSON.parse(text)
  } catch (err) {
    console.error('Claude API failed, using mock:', err)
    return getMockSuggestions()
  }
}

function getMockSuggestions() {
  return [
    {
      category: 'Food',
      overspend_amount: 2400,
      suggestion: 'You spent ₹2,400 on food delivery this month — 3× your usual. Cooking at home 3 extra days could save ~₹800 next month.',
      estimated_saving: 800,
    },
    {
      category: 'Entertainment',
      overspend_amount: 1200,
      suggestion: 'Entertainment spend jumped 60% this month. Consider cancelling 1-2 streaming subscriptions you rarely use to save ₹400/month.',
      estimated_saving: 400,
    },
    {
      category: 'Shopping',
      overspend_amount: 3500,
      suggestion: 'Impulse shopping detected — 5 purchases under ₹500 each. Try a 24-hour wait rule before buying non-essentials.',
      estimated_saving: 1200,
    },
  ]
}
