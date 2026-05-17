import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function GET() {
  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  try {
    const hoje = new Date()
    const dia = hoje.getDay()
    const diff = (dia + 6) % 7

    // Semana passada: inicio = segunda-feira passada
    const inicio = new Date(hoje)
    inicio.setDate(hoje.getDate() - diff - 7)
    inicio.setHours(0,0,0,0)

    // Semana passada: fim = domingo passado
    const fim = new Date(inicio)
    fim.setDate(inicio.getDate() + 6)
    fim.setHours(23,59,59,999)

    const result = await pool.query(
      'SELECT * FROM freelancers WHERE data >= $1 AND data <= $2',
      [inicio.toISOString().split('T')[0], fim.toISOString().split('T')[0]]
    )

    const records = result.rows
    if (records.length === 0) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: 'ℹ️ Nenhum lançamento de freelancer na semana passada.', parse_mode: 'Markdown' })
      })
      return NextResponse.json({ ok: true, message: 'Sem registros' })
    }

    let resumo = {}
    let totalGeral = 0

    records.forEach(r => {
      if (!resumo[r.nome]) resumo[r.nome] = { funcao: r.funcao, total: 0, dias: 0 }
      resumo[r.nome].total += parseFloat(r.valor)
      resumo[r.nome].dias += 1
      totalGeral += parseFloat(r.valor)
    })

    const strInicio = inicio.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
    const strFim = fim.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })

    let msg = `📊 *Fechamento Freelancers*\n🗓️ ${strInicio} a ${strFim}\n\n`
    
    Object.keys(resumo).sort().forEach(nome => {
      const p = resumo[nome]
      msg += `👤 *${nome}* (${p.funcao})\n`
      msg += `   Dias: ${p.dias} | Total: R$ ${p.total.toFixed(2)}\n\n`
    })

    msg += `💰 *TOTAL DA SEMANA: R$ ${totalGeral.toFixed(2)}*`

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    })

    return NextResponse.json({ ok: true, message: 'Relatório enviado com sucesso' })

  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
