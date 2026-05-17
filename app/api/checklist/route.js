import { NextResponse } from 'next/server'

export async function POST(req) {
  const { nome, tipo, turno, tarefas, resultados } = await req.json()

  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  const emojiFoto = (r) => r?.aprovado ? '✅' : '❌'

  const fotosTexto = {
    salao: `${emojiFoto(resultados?.salao)} Salão — ${resultados?.salao?.observacao || 'não enviado'}`,
    banheiro_m: `${emojiFoto(resultados?.banheiro_m)} Banheiro M — ${resultados?.banheiro_m?.observacao || 'não enviado'}`,
    banheiro_f: `${emojiFoto(resultados?.banheiro_f)} Banheiro F — ${resultados?.banheiro_f?.observacao || 'não enviado'}`,
    frente: `${emojiFoto(resultados?.frente)} Frente de loja — ${resultados?.frente?.observacao || 'não enviado'}`,
  }

  const temReprovado = Object.values(resultados || {}).some(r => !r?.aprovado)

  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

  const msg = `
🍕 *Checklist ${tipo === 'garcom' ? 'Garçom' : tipo} — ${turno}*
👤 *${nome}* — ${agora}

*Tarefas:*
${Object.values(tarefas || {}).every(v => v) ? '✅ Todas concluídas' : '⚠️ Nem todas marcadas'}

*Fotos:*
${Object.values(fotosTexto).join('\n')}

${temReprovado ? '⚠️ *ATENÇÃO: há itens com pendência!*' : '✅ *Tudo certo!*'}
`.trim()

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
  })

  return NextResponse.json({ ok: true })
}