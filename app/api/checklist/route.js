import { NextResponse } from 'next/server'

export async function POST(req) {
  const { nome, tipo, turno, tarefas, resultados, extras } = await req.json()

  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

  const emojiFoto = (r) => r?.aprovado ? '✅' : '❌'

  const tipoLabel = {
    garcom: 'Garçom 🍽️',
    pizzaiolo: 'Pizzaiolo 🍕',
    caixa: 'Caixa 💴',
    atendente: 'Atendente 📲',
    despacho: 'Despacho 🛵',
    compras: 'Compras 🛒',
  }

  let fotosTexto = ''
  if (resultados && Object.keys(resultados).length > 0) {
    const fotoLabels = {
      salao: 'Salão',
      banheiro_m: 'Banheiro M',
      banheiro_f: 'Banheiro F',
      frente: 'Frente de loja',
      bancadas: 'Bancadas',
    }
    fotosTexto = '\n*Fotos:*\n' + Object.entries(resultados).map(([key, r]) =>
      `${emojiFoto(r)} ${fotoLabels[key] || key} — ${r?.observacao || 'não enviado'}`
    ).join('\n')
  }

  let extrasTexto = ''
  if (extras) {
    if (extras.freelancerAtendimento) {
      extrasTexto += `\n*Freelancers:*\nAtendimento: ${extras.freelancerAtendimento} | Cozinha: ${extras.freelancerCozinha} | Motoboy: ${extras.freelancerMotoboy}`
    }
    if (extras.valores) {
      const total = Object.values(extras.valores).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)
      extrasTexto += `\n*Total compras: R$ ${total.toFixed(2)}*`
      extrasTexto += `\nStatus: ${extras.pendente ? '⚠️ Ficou pendente' : '✅ Pedido finalizado'}`
    }
  }

  const temReprovado = resultados && Object.values(resultados).some(r => !r?.aprovado)
  const todasTarefas = tarefas && Object.values(tarefas).every(v => v)

  const msg = `
🍕 *Checklist ${tipoLabel[tipo] || tipo} — ${turno}*
👤 *${nome}* — ${agora}

*Tarefas:*
${todasTarefas ? '✅ Todas concluídas' : '⚠️ Nem todas marcadas'}
${fotosTexto}${extrasTexto}

${temReprovado ? '⚠️ *ATENÇÃO: há itens com pendência!*' : '✅ *Tudo certo!*'}
`.trim()

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
  })

  return NextResponse.json({ ok: true })
}