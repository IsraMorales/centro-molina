export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  try {
    const { base64, mediaType } = req.body;

    if (!base64 || !mediaType) {
      return res.status(400).json({ error: 'Faltan datos del archivo' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: 'Eres un analizador de documentos para una imprenta. Analiza el nivel de color de cada página. Responde SOLO con JSON válido, sin texto adicional, sin explicaciones, sin backticks.',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: mediaType, data: base64 }
              },
              {
                type: 'text',
                text: `Analiza este documento PDF. Para CADA página estima el porcentaje de cobertura de color (0% = solo blanco/negro, 100% = toda la página cubierta de color). Responde ÚNICAMENTE con un JSON sin ningún texto adicional, sin backticks, sin explicaciones. Formato exacto:
{"paginas":[{"num":1,"pct":15},{"num":2,"pct":72}]}`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error API Anthropic:', data);
      return res.status(500).json({ error: 'Error al consultar la IA' });
    }

    const texto = data.content.map(i => i.text || '').join('').trim();
    const limpio = texto.replace(/```json|```/g, '').trim();
    const resultado = JSON.parse(limpio);

    return res.status(200).json(resultado);

  } catch (err) {
    console.error('Error en /api/analizar:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
