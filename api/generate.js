module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  let body = '';
  await new Promise((resolve) => {
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', resolve);
  });

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  const { system, message } = parsed;
  if (!system || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: system,
        messages: [{ role: 'user', content: message }]
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(response.status).json({ error: data.error?.message || 'Anthropic API error' });

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
