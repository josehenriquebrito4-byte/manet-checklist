import { NextResponse } from 'next/server'
import { computeResumoVendas } from '../../../lib/resumo-vendas'

export const dynamic = 'force-dynamic'

export async function GET() {
  const token = process.env.SAIPOS_TOKEN
  
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Variável de ambiente SAIPOS_TOKEN não configurada.' }, { status: 500 })
  }

  // Calculando o shift_date (data operacional do restaurante considerando virada de turno às 06:00)
  const now = new Date()
  const brTimeStr = now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
  const brTime = new Date(brTimeStr)
  
  if (brTime.getHours() < 6) {
    brTime.setDate(brTime.getDate() - 1)
  }
  
  const yyyy = brTime.getFullYear()
  const mm = String(brTime.getMonth() + 1).padStart(2, '0')
  const dd = String(brTime.getDate()).padStart(2, '0')
  const shiftDate = `${yyyy}-${mm}-${dd}`

  const url = `https://data.saipos.io/v1/search_sales?p_date_column_filter=shift_date&p_filter_date_start=${shiftDate}T00:00:00&p_filter_date_end=${shiftDate}T23:59:59&p_limit=1000`

  try {
    const res = await fetch(url, { 
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    })

    if (!res.ok) {
       const text = await res.text()
       return NextResponse.json({ ok: false, error: 'Erro ao buscar dados na Saipos', details: text }, { status: res.status })
    }

    const data = await res.json()

    const { totalVendas, quantidadePedidos, ticketMedio, canais } = computeResumoVendas(data)

    // Pega os 10 pedidos mais recentes (independente de cancelamento)
    const sorted = [...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const ultimos = sorted.slice(0, 10).map(v => {
      const hora = v.created_at ? v.created_at.split('T')[1].substring(0, 5) : '--:--'
      return {
        id: v.id_sale,
        cliente: v.customer?.name || 'Cliente sem nome',
        total: v.total_amount,
        canal: v.partner_sale?.desc_partner_sale || 'Loja Própria',
        hora: hora,
        cancelado: v.canceled === 'S'
      }
    })

    return NextResponse.json({
      ok: true,
      shiftDate,
      resumo: {
        totalVendas,
        quantidadePedidos,
        ticketMedio,
        canais
      },
      ultimos
    })
  } catch (e) {
    console.error('Erro Saipos API:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
