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

  // ----- PARSE MODE: TimeBlock plain-language task extraction -----
  if (body.mode === 'parse') {
    const text = String(body.text || '').slice(0, 2000);
    if (!text.trim()) return { statusCode: 400, body: JSON.stringify({ error: 'No text provided' }) };
    const PARSE_SYS = `You extract a task list from a person's plain-language description of their day. Return ONLY a JSON array, no markdown, no commentary. Each element: {"name": short task name, "dur": estimated minutes as integer, "pri": one of "high"/"med"/"low", "brk": true if it is a break/meal else false}. Infer reasonable durations if not stated (a meal ~45, a quick email ~20, studying ~60-90). Infer priority from urgency words; default "med". Keep names short and clean.`;
    const MODEL = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    try {
      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: PARSE_SYS }] },
          contents: [{ role: 'user', parts: [{ text }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 700, responseMimeType: 'application/json' }
        })
      });
      if (!resp.ok) {
        if (resp.status === 429) return { statusCode: 200, body: JSON.stringify({ tasks: null, error: 'Rate limit hit. Wait a moment and try again.' }) };
        const t = await resp.text();
        return { statusCode: 502, body: JSON.stringify({ error: 'The AI service returned an error.', detail: t.slice(0, 200) }) };
      }
      const data = await resp.json();
      let raw = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || '[]';
      raw = raw.replace(/^```json\s*|\s*```$/g, '').trim();
      let tasks;
      try { tasks = JSON.parse(raw); } catch { tasks = []; }
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tasks }) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong reaching the AI service.' }) };
    }
  }

  // ----- TEST MODE: PromptLab run a prompt live -----
  if (body.mode === 'test') {
    const prompt = String(body.prompt || '').slice(0, 3000);
    if (!prompt.trim()) return { statusCode: 400, body: JSON.stringify({ error: 'No prompt provided' }) };
    const MODEL = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    try {
      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      });
      if (!resp.ok) {
        if (resp.status === 429) return { statusCode: 200, body: JSON.stringify({ output: null, error: 'Rate limit hit. Wait a moment and try again.' }) };
        const t = await resp.text();
        return { statusCode: 502, body: JSON.stringify({ error: 'The AI service returned an error.', detail: t.slice(0, 200) }) };
      }
      const data = await resp.json();
      const output = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || '(no output)';
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ output }) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong reaching the AI service.' }) };
    }
  }

  // ----- MEMO MODE: LedgerLens audit finding memo -----
  if (body.mode === 'memo') {
    const f = body.finding || {};
    const detail = `Test: ${f.test||'n/a'}\nSeverity: ${f.severity||'n/a'}\nEntry: ${f.entry_id||'n/a'}\nDate: ${f.date||'n/a'}\nParty: ${f.vendor||'n/a'}\nAmount: ${f.amount!=null?'$'+f.amount:'n/a'}\nObservation: ${f.note||'n/a'}`;
    const MEMO_SYS = `You are a staff auditor drafting a workpaper finding memo. Using the finding details provided, write a concise, professional audit finding memo with exactly these labeled sections: Condition, Criteria, Cause, Effect, Recommendation. Keep each section to 1-2 sentences. Base it only on the finding given; where cause is unknown, note it requires follow-up rather than inventing facts. Plain text, no markdown symbols, label each section like "Condition:" on its own line.`;
    const MODEL = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    try {
      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: MEMO_SYS }] },
          contents: [{ role: 'user', parts: [{ text: detail }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 400 }
        })
      });
      if (!resp.ok) {
        if (resp.status === 429) return { statusCode: 200, body: JSON.stringify({ memo: null, error: 'Rate limit hit. Wait a moment and try again.' }) };
        const t = await resp.text();
        return { statusCode: 502, body: JSON.stringify({ error: 'The AI service returned an error.', detail: t.slice(0, 200) }) };
      }
      const data = await resp.json();
      const memo = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || '';
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memo }) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong reaching the AI service.' }) };
    }
  }

  // ----- REWRITE MODE: ClarityCheck sentence rewriting -----
  if (body.mode === 'rewrite') {
    const sentence = String(body.sentence || '').slice(0, 1200);
    const goal = ['concise', 'formal', 'simple'].includes(body.goal) ? body.goal : 'concise';
    if (!sentence.trim()) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No sentence provided' }) };
    }
    const goalText = {
      concise: 'Make it as clear and concise as possible. Cut filler and redundancy while keeping the full meaning.',
      formal: 'Make it clear and professional in tone, suitable for business or academic writing, without being stuffy.',
      simple: 'Make it plain and easy to read at roughly an 8th grade level. Short words, short sentences, active voice.'
    }[goal];
    const REWRITE_SYS = `You are an editor. Rewrite the single sentence the user gives you to improve its clarity. ${goalText} Keep the original meaning. Return ONLY the rewritten sentence with no quotes, no preamble, no explanation, no markdown.`;
    const MODEL = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
    try {
      const resp = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: REWRITE_SYS }] },
          contents: [{ role: 'user', parts: [{ text: sentence }] }],
          generationConfig: { temperature: 0.6, maxOutputTokens: 300 }
        })
      });
      if (!resp.ok) {
        if (resp.status === 429) return { statusCode: 200, body: JSON.stringify({ rewrite: null, error: 'Rate limit hit. Wait a moment and try again.' }) };
        const t = await resp.text();
        return { statusCode: 502, body: JSON.stringify({ error: 'The AI service returned an error.', detail: t.slice(0, 200) }) };
      }
      const data = await resp.json();
      let rw = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('').trim() || '';
      rw = rw.replace(/^["']|["']$/g, '').trim();
      return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rewrite: rw }) };
    } catch (e) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Something went wrong reaching the AI service.' }) };
    }
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
