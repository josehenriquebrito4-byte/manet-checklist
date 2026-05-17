import { NextResponse } from 'next/server'

export async function POST(req) {
  const { funcionario, item, imageBase64, mimeType } = await req.json()

  const prompts = {
    gas: 'Esta foto mostra um registro de gás. O registro está fechado (posição perpendicular ao cano)? Responda em JSON: {"aprovado": true/false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
    freezer: 'Esta foto mostra um freezer. O freezer está organizado e fechado corretamente? Responda em JSON: {"aprovado": true/false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
    bancada: 'Esta foto mostra uma bancada de pizzaria. A bancada está limpa e montada? Responda em JSON: {"aprovado": true/false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
  }

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompts[item] || 'Analise a imagem e responda em JSON: {"aprovado": true, "status": "OK", "observacao": "ok"}' },
          { inline_data: { mime_type: mimeType, data: imageBase64 } }
        ]
      }]
    })
  })

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  
  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const resultado = JSON.parse(clean)
    return NextResponse.json({ ok: true, resultado })
  } catch {
    return NextResponse.json({ ok: true, resultado: { aprovado: true, status: 'OK', observacao: 'Analisado' } })
  }
}