// Netlify serverless function: secure proxy to the Gemini API.
// The API key lives in a Netlify environment variable (GEMINI_API_KEY),
// never in the front-end code, so it can't be scraped from the page source.

// Background knowledge the assistant uses to answer questions about the tools.
const SYSTEM_CONTEXT = `
You are the AI assistant on Ariel Bodik's portfolio site. Ariel is an accounting student at Fairleigh Dickinson University who also builds software, and is interning as an auditor. Answer questions about his tools and the concepts behind them in a clear, friendly, concise way. Keep answers short unless asked for detail.

The tools on the site:

1. LedgerLens (audit analytics): Upload a general ledger as CSV or Excel and it tests every transaction in the whole population, not a sample, for fraud and error patterns. It runs six procedures: Benford's Law (checks if the first digits of amounts follow the natural logarithmic distribution; big deviations suggest fabricated numbers), duplicate payment detection, threshold gaming (entries clustered just under an approval limit), round-dollar entries, off-hours/weekend posting, and statistical outliers. It auto-detects which columns are which, so it works with any ledger format. It then writes a plain-English summary of what it found. Runs entirely in the browser; data is never uploaded.

2. PromptLab (AI utility): A workbench that rebuilds a rough AI prompt into a stronger one by applying techniques like role assignment, context framing, step-by-step reasoning, output formatting, and constraints. It explains what each change does.

3. ClarityCheck (text intelligence): Paste any writing and it analyzes readability: reading grade level (Flesch-Kincaid), passive voice, sentence length, and filler phrases, with specific suggestions to fix them.

4. TimeBlock (productivity): Type your tasks in plain language with rough durations and priorities, and it builds a time-blocked schedule that fits your working hours, orders the important work into your freshest hours, and inserts breaks.

If asked something unrelated to the tools or general knowledge, you can still help, but gently steer back toward the portfolio when natural. Never claim to be Ariel himself; you are his site's assistant.
`;

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: 'The assistant is not configured yet. The site owner needs to add an API key.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Bad request' }) }; }

  const history = Array.isArray(body.messages) ? body.messages : [];
  if (!history.length) {
    return { statusCode: 400, body: JSON.stringify({ error: 'No message provided' }) };
  }

  // Build Gemini-format contents. Gemini uses roles "user" and "model".
  const contents = history.slice(-12).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: String(m.content || '').slice(0, 4000) }]
  }));

  const MODEL = 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;

  const payload = {
    systemInstruction: { parts: [{ text: SYSTEM_CONTEXT }] },
    contents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
  };

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const errText = await resp.text();
      // Surface rate-limit clearly
      if (resp.status === 429) {
        return { statusCode: 200, body: JSON.stringify({ reply: "I'm getting a lot of questions right now and hit a temporary rate limit. Give it a minute and try again." }) };
      }
      return { statusCode: 502, body: JSON.stringify({ error: 'The AI service returned an error.', detail: errText.slice(0, 300) }) };
    }

    const data = await resp.json();
    const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || "I couldn't generate a response to that. Try rephrasing?";
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong reaching the AI service.' }) };
  }
};
