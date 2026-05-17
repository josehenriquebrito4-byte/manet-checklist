import { NextResponse } from 'next/server'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS checklists (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      tipo VARCHAR(50),
      turno VARCHAR(50),
      tarefas_ok BOOLEAN,
      fotos_ok BOOLEAN,
      extras JSONB,
      resultados JSONB,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE TABLE IF NOT EXISTS freelancers (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(100),
      funcao VARCHAR(50),
      valor DECIMAL(10,2),
      data DATE,
      pago BOOLEAN DEFAULT FALSE,
      criado_em TIMESTAMP DEFAULT NOW()
    )
  `)
}

export async function POST(req) {
  const { nome, tipo, turno, tarefas, resultados, extras } = await req.json()

  const token = process.env.TELEGRAM_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  const agora = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })

  const tarefasOk = Boolean(tarefas && Object.values(tarefas).every(v => v))
  const fotosOk = Boolean(resultados && Object.keys(resultados).length > 0 ? Object.values(resultados).every(r => r?.aprovado) : true)

  try {
    await initDB()
    await pool.query(
      'INSERT INTO checklists (nome, tipo, turno, tarefas_ok, fotos_ok, extras, resultados) VALUES ($1,$2,$3,$4,$5,$6,$7)',
      [nome || null, tipo || null, turno || null, tarefasOk, fotosOk, JSON.stringify(extras || {}), JSON.stringify(resultados || {})]
    )
  } catch (e) { console.error('DB error:', e) }

  const emojiFoto = (r) => r?.aprovado ? '✅' : '❌'
  const tipoLabel = {
    garcom: 'Garçom 🍽️', pizzaiolo: 'Pizzaiolo 🍕', caixa: 'Caixa 💴',
    atendente: 'Atendente 📲', despacho: 'Despacho 🛵', compras: 'Compras 🛒',
  }

  let fotosTexto = ''
  if (resultados && Object.keys(resultados).length > 0) {
    const fotoLabels = { salao: 'Salão', banheiro_m: 'Banheiro M', banheiro_f: 'Banheiro F', frente: 'Frente de loja', bancadas: 'Bancadas' }
    fotosTexto = '\n*Fotos:*\n' + Object.entries(resultados).map(([key, r]) =>
      `${emojiFoto(r)} ${fotoLabels[key] || key} — ${r?.observacao || 'não enviado'}`
    ).join('\n')
  }

  let extrasTexto = ''
  if (extras?.freelancerAtendimento) {
    extrasTexto += `\n*Freelancers:*\nAtendimento: ${extras.freelancerAtendimento} | Cozinha: ${extras.freelancerCozinha} | Motoboy: ${extras.freelancerMotoboy}`
  }
  if (extras?.valores) {
    const total = Object.values(extras.valores).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)
    extrasTexto += `\n*Total compras: R$ ${total.toFixed(2)}*`
    extrasTexto += `\nStatus: ${extras.pendente ? '⚠️ Ficou pendente' : '✅ Pedido finalizado'}`
  }

  const temReprovado = resultados && Object.values(resultados).some(r => !r?.aprovado)

  const msg = `🍕 *Checklist ${tipoLabel[tipo] || tipo} — ${turno}*\n👤 *${nome}* — ${agora}\n\n*Tarefas:*\n${tarefasOk ? '✅ Todas concluídas' : '⚠️ Nem todas marcadas'}${fotosTexto}${extrasTexto}\n\n${temReprovado ? '⚠️ *ATENÇÃO: há itens com pendência!*' : '✅ *Tudo certo!*'}`.trim()

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: 'Markdown' })
  })

  return NextResponse.json({ ok: true })
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const tipo = searchParams.get('tipo')
  
  try {
    let result;
    if (tipo) {
      result = await pool.query('SELECT * FROM checklists WHERE tipo = $1 ORDER BY criado_em DESC', [tipo])
    } else {
      result = await pool.query('SELECT * FROM checklists ORDER BY criado_em DESC LIMIT 100')
    }
    return NextResponse.json({ ok: true, data: result.rows })
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}