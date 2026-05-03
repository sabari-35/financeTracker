/* Gemini API proxy — called from client side via a simple fetch wrapper. */

export async function getAISuggestions(transactionSummary) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return getMockSuggestions()
  }

  const prompt = `Analyse this user's spending data for the last 30 days and provide insights.

Transaction Summary:
${JSON.stringify(transactionSummary, null, 2)}

Identify the top 3 unnecessary spend patterns. For each, give a specific, friendly, actionable suggestion to reduce it. 

Respond ONLY with valid JSON in this exact format:
[
  {
    "category": "Category Name",
    "overspend_amount": 1500,
    "suggestion": "Specific actionable tip here",
    "estimated_saving": 500
  }
]`

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      })
    })

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('QUOTA_EXCEEDED')
      }
      throw new Error(`Gemini API error: ${response.status}`)
    }
    
    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]'
    return JSON.parse(text)
  } catch (err) {
    if (err.message === 'QUOTA_EXCEEDED') throw err;
    console.error('Gemini API failed, using mock:', err)
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
