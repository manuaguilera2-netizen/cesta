exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }) };
  }

  try {
    const body = JSON.parse(event.body);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: body.mediaType,
                  data: body.imageData
                }
              },
              {
                text: 'Analitza aquest tiquet de supermercat. Extreu: 1) el nom del supermercat, 2) la data de la compra en format DD/MM/YYYY (si no la veus posa la data d\'avui), 3) tots els productes amb el seu preu final. Respon ÚNICAMENT en JSON sense backticks ni text addicional:\n{"supermercat":"NomDelSuper","data":"DD/MM/YYYY","productes":[{"nom":"nom producte","preu":1.23}]}'
              }
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1000
          }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
