import { NextResponse } from 'next/server'

export async function GET() {
  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const url = process.env.NEXT_PUBLIC_URL || 'https://checklist.mundomanet.tech'

  const msg = `🍕 *CHECKLIST DE ABERTURA — ${new Date().toLocaleDateString('pt-BR')}*

Pessoal, chegou a hora! Preencham o checklist de abertura:

🍽️ Garçom → ${url}/checklist/garcom
🍕 Pizzaiolo → ${url}/checklist/pizzaiolo
💴 Caixa → ${url}/checklist/caixa
📲 Atendente → ${url}/checklist/atendente
🛵 Despacho → ${url}/checklist/despacho
🛒 Compras → ${url}/checklist/compras

✅ Assim que terminar, sinalize aqui com ❤️`

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
  })

  return NextResponse.json({ ok: true })
}