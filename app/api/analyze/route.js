import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

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
  let refContent = []
  try {
    const result = await pool.query('SELECT image_base64, mime_type FROM referencias WHERE key = $1', [item])
    if (result.rows.length > 0) {
      const refData = {
        imageBase64: result.rows[0].image_base64,
        mimeType: result.rows[0].mime_type
      }
      refContent = [
        { type: 'text', text: `Esta é a FOTO DE REFERÊNCIA mostrando como deve estar o ${labels[item] || item}:` },
        { type: 'image', source: { type: 'base64', media_type: refData.mimeType, data: refData.imageBase64 } },
        { type: 'text', text: `Agora analise a FOTO DO FUNCIONÁRIO abaixo e compare com a referência. O ambiente está parecido com a referência? Está limpo e organizado da mesma forma? Responda APENAS em JSON sem nenhum texto extra: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}` },
        { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
      ]
    }
  } catch (e) {
    console.error('Erro ao buscar referencia:', e)
  }

  const content = refContent.length > 0 ? refContent : [
    { type: 'text', text: `Analise esta foto de ${labels[item] || item}. O ambiente está limpo e organizado? Responda APENAS em JSON: {"aprovado": true ou false, "status": "OK" ou "ATENÇÃO", "observacao": "frase curta descrevendo o que viu"}` },
    { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content }]
    })
  })

  const data = await res.json()
  console.log('Claude response:', JSON.stringify(data))
  const text = data.content?.[0]?.text || ''

  try {
    const clean = text.replace(/```json|```/g, '').trim()
    const resultado = JSON.parse(clean)
    return NextResponse.json({ ok: true, resultado })
  } catch {
    return NextResponse.json({ ok: true, resultado: { aprovado: false, status: 'ATENÇÃO', observacao: 'Não foi possível analisar a foto' } })
  }
}