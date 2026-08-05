import { NextResponse } from 'next/server'
import { computeConsumoTeorico } from '../../../lib/consumo-teorico'

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

  const url = `https://data.saipos.io/v1/sales_items?p_date_column_filter=shift_date&p_filter_date_start=${date}T00:00:00&p_filter_date_end=${date}T23:59:59&p_limit=5000`

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados na Saipos', details: text }, { status: res.status })
    }

    const salesItems = await res.json()
    const consumo = computeConsumoTeorico(salesItems)

    return NextResponse.json({ ok: true, date, ...consumo })
  } catch (e) {
    console.error('Erro consumo-teorico:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
