import { NextResponse } from 'next/server'

export async function POST(req) {
  const { nome, item, imageBase64, mimeType, tipo } = await req.json()

  const labels = {
    salao: 'salão de restaurante arrumado e limpo',
    banheiro_m: 'banheiro masculino limpo e organizado',
    banheiro_f: 'banheiro feminino limpo e organizado',
    frente: 'frente de loja limpa e organizada',
    gas: 'registro de gás fechado',
    freezer: 'freezer organizado',
    bancada: 'bancada de pizzaria limpa e montada',
  }

  // Tenta buscar foto de referência
  let refParts = []
  try {
    const refRes = await fetch(`${process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'}/api/reference?key=${item}`)
    const refData = await refRes.json()
    if (refData.ok) {
      refParts = [
        { text: `Esta é a FOTO DE REFERÊNCIA mostrando como deve estar o ${labels[item] || item}:` },
        { inline_data: { mime_type: refData.mimeType, data: refData.imageBase64 } },
        { text: `Agora analise a FOTO DO FUNCIONÁRIO abaixo e compare com a referência. O ambiente está parecido com a referência? Está limpo e organizado da mesma forma? Responda APENAS em JSON sem nenhum texto extra: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}` },
      ]
    }
  } catch (e) {}

  const parts = refParts.length > 0 ? [
    ...refParts,
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ] : [
    { text: `Analise esta foto de ${labels[item] || item}. O ambiente está limpo e organizado? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}` },
    { inline_data: { mime_type: mimeType, data: imageBase64 } }
  ]

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0.1 }
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