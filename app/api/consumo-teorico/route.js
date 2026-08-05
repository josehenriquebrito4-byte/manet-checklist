import { NextResponse } from 'next/server'
import { computeConsumoTeorico } from '../../../lib/consumo-teorico'
import { computeResumoVendas } from '../../../lib/resumo-vendas'

export const dynamic = 'force-dynamic'

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
    const [itemsRes, salesRes] = await Promise.all([
      fetch(itemsUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
      fetch(salesUrl, { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' }),
    ])

    if (!itemsRes.ok) {
      const text = await itemsRes.text()
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados na Saipos', details: text }, { status: itemsRes.status })
    }
    if (!salesRes.ok) {
      const text = await salesRes.text()
      return NextResponse.json({ ok: false, error: 'Erro ao buscar resumo de vendas na Saipos', details: text }, { status: salesRes.status })
    }

    const salesItems = await itemsRes.json()
    const salesData = await salesRes.json()

    const consumo = computeConsumoTeorico(salesItems)
    const resumo = computeResumoVendas(salesData)

    return NextResponse.json({ ok: true, date, ...consumo, ...resumo })
  } catch (e) {
    console.error('Erro consumo-teorico:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
