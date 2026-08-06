import { NextResponse } from 'next/server'
import { computeConsumoTeorico } from '../../../lib/consumo-teorico'
import { computeResumoVendas } from '../../../lib/resumo-vendas'

export const dynamic = 'force-dynamic'

// A Saipos usa um backend PostgREST que ocasionalmente estoura o pool de
// conexões dele (PGRST002/PGRST003) ou some no meio da conexão (ECONNRESET),
// sempre de forma transitória — a mesma chamada costuma funcionar segundos
// depois. Por isso cada fetch tenta de novo (backoff curto) antes de desistir.
const RETRYABLE_STATUS = new Set([502, 503, 504])
const RETRYABLE_BODY_RE = /PGRST002|PGRST003/

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchSaiposComRetry(url, token, { retries = 2, baseDelayMs = 400 } = {}) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' })
    } catch (e) {
      if (attempt === retries) throw e
      await sleep(baseDelayMs * (attempt + 1))
      continue
    }

    if (res.ok) {
      return { ok: true, data: await res.json() }
    }

    const details = await res.text()
    const retryable = RETRYABLE_STATUS.has(res.status) || RETRYABLE_BODY_RE.test(details)
    if (!retryable || attempt === retries) {
      return { ok: false, status: res.status, details }
    }
    await sleep(baseDelayMs * (attempt + 1))
  }
}

function shiftDateHoje() {
  const now = new Date()
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  if (brTime.getHours() < 6) brTime.setDate(brTime.getDate() - 1)
  const yyyy = brTime.getFullYear()
  const mm = String(brTime.getMonth() + 1).padStart(2, '0')
  const dd = String(brTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export async function GET(request) {
  const token = process.env.SAIPOS_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Variável de ambiente SAIPOS_TOKEN não configurada.' }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date') || shiftDateHoje()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: 'Parâmetro date inválido, use YYYY-MM-DD.' }, { status: 400 })
  }

  const itemsUrl = `https://data.saipos.io/v1/sales_items?p_date_column_filter=shift_date&p_filter_date_start=${date}T00:00:00&p_filter_date_end=${date}T23:59:59&p_limit=5000`
  const salesUrl = `https://data.saipos.io/v1/search_sales?p_date_column_filter=shift_date&p_filter_date_start=${date}T00:00:00&p_filter_date_end=${date}T23:59:59&p_limit=1000`

  try {
    const [itemsResult, salesResult] = await Promise.all([
      fetchSaiposComRetry(itemsUrl, token),
      fetchSaiposComRetry(salesUrl, token),
    ])

    if (!itemsResult.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados na Saipos', details: itemsResult.details }, { status: itemsResult.status })
    }
    if (!salesResult.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao buscar resumo de vendas na Saipos', details: salesResult.details }, { status: salesResult.status })
    }

    const salesItems = itemsResult.data
    const salesData = salesResult.data

    const consumo = computeConsumoTeorico(salesItems)
    const resumo = computeResumoVendas(salesData)

    return NextResponse.json({ ok: true, date, ...consumo, ...resumo })
  } catch (e) {
    console.error('Erro consumo-teorico:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
