import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

function getSemanaAnterior() {
  const hoje = new Date()
  const dia = hoje.getDay()
  let diff = (dia + 4) % 7
  const fimSemana = new Date(hoje)
  fimSemana.setDate(hoje.getDate() - diff - 1)
  fimSemana.setHours(23,59,59,999)
  const inicioSemana = new Date(fimSemana)
  inicioSemana.setDate(fimSemana.getDate() - 6)
  inicioSemana.setHours(0,0,0,0)
  return { inicio: inicioSemana, fim: fimSemana }
}

function parseData(dataStr) {
  const s = typeof dataStr === 'string' ? dataStr.split('T')[0] : new Date(dataStr).toISOString().split('T')[0]
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export async function GET() {
  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  try {
    const { inicio, fim } = getSemanaAnterior()

    const [motoboys, descontos] = await Promise.all([
      pool.query('SELECT * FROM motoboys ORDER BY nome'),
      pool.query('SELECT * FROM descontos ORDER BY nome'),
    ])

    const filtrar = (items) => items.filter(i => {
      const d = parseData(i.data)
      return d >= inicio && d <= fim
    })

    const motoboySemana = filtrar(motoboys.rows)
    const descontoSemana = filtrar(descontos.rows)
    const nomes = [...new Set(motoboySemana.map(m => m.nome))]

    if (nomes.length === 0) {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: '*Fechamento de Motoboys*\n\nNenhum lancamento na semana anterior.', parse_mode: 'Markdown' })
      })
      return NextResponse.json({ ok: true })
    }

    const linhas = nomes.map(nome => {
      const lancs = motoboySemana.filter(m => m.nome === nome)
      const descs = descontoSemana.filter(d => d.nome === nome)
      const bruto = lancs.reduce((a, l) => a + parseFloat(l.valor), 0)
      const totalDesc = descs.reduce((a, d) => a + parseFloat(d.valor), 0)
      const liq = bruto - totalDesc
      const pg = lancs.every(l => l.pago)
      let linha = `*${nome}*\n`
      linha += `Bruto: R$ ${bruto.toFixed(2)}`
      if (totalDesc > 0) linha += ` | Descontos: -R$ ${totalDesc.toFixed(2)}`
      linha += `\nLiquido: R$ ${liq.toFixed(2)}`
      linha += ` - ${pg ? 'Pago' : 'Pendente'}`
      return linha
    }).join('\n\n')

    const totalGeral = nomes.reduce((a, nome) => {
      const lancs = motoboySemana.filter(m => m.nome === nome)
      const descs = descontoSemana.filter(d => d.nome === nome)
      const bruto = lancs.reduce((acc, l) => acc + parseFloat(l.valor), 0)
      const totalDesc = descs.reduce((acc, d) => acc + parseFloat(d.valor), 0)
      return a + bruto - totalDesc
    }, 0)

    const msg = `*FECHAMENTO DE MOTOBOYS*\nSemana: ${inicio.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}\n\n${linhas}\n\nTotal a pagar: R$ ${totalGeral.toFixed(2)}`

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}