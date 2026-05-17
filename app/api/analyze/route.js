import { NextResponse } from 'next/server'

export async function POST(req) {
  const { nome, item, imageBase64, mimeType, tipo } = await req.json()

  const prompts = {
    salao: 'Esta foto mostra um salão de restaurante. O salão está com mesas organizadas, cadeiras arrumadas e ambiente limpo? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}',
    banheiro_m: 'Esta foto mostra um banheiro masculino. O banheiro está limpo, organizado e em condições de uso? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}',
    banheiro_f: 'Esta foto mostra um banheiro feminino. O banheiro está limpo, organizado e em condições de uso? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}',
    frente: 'Esta foto mostra a frente de uma loja de restaurante. A fachada está limpa, organizada e pronta para receber clientes? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}',
    gas: 'Esta foto mostra um registro de gás. O registro está fechado (posição perpendicular ao cano)? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
    freezer: 'Esta foto mostra um freezer. O freezer está organizado e fechado corretamente? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
    bancada: 'Esta foto mostra uma bancada de pizzaria. A bancada está limpa e montada? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta"}',
  }

  const prompt = prompts[item] || 'Analise se a imagem mostra o ambiente limpo e organizado. Responda APENAS em JSON: {"aprovado": true, "status": "OK", "observacao": "ok"}'

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: mimeType, data: imageBase64 } }
        ]
      }],
      generationConfig: {
        temperature: 0.1
      }
    })
  })

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const resultado = JSON.parse(clean)
    return NextResponse.json({ ok: true, resultado })
  } catch {
    return NextResponse.json({ ok: true, resultado: { aprovado: false, status: 'ATENÇÃO', observacao: 'Não foi possível analisar a foto' } })
  }
}