import { NextResponse } from 'next/server'
import { computePedidosProntos, JANELA_PADRAO_MINUTOS } from '../../../lib/painel-despacho'
import { fetchSaiposComRetry, shiftDateHoje } from '../../../lib/saipos-fetch'

export const dynamic = 'force-dynamic'

// Sem no-store explícito, o navegador/proxy da TV pode servir uma resposta
// cacheada em vez de buscar a mais recente a cada poll, atrasando a
// remoção de pedido já retirado mesmo com o servidor já refletindo a
// mudança.
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' }

export async function GET() {
  const token = process.env.SAIPOS_TOKEN
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Variável de ambiente SAIPOS_TOKEN não configurada.' }, { status: 500, headers: NO_STORE_HEADERS })
  }

  const date = shiftDateHoje()
  const itemsUrl = `https://data.saipos.io/v1/sales_items?p_date_column_filter=shift_date&p_filter_date_start=${date}T00:00:00&p_filter_date_end=${date}T23:59:59&p_limit=5000`
  const salesUrl = `https://data.saipos.io/v1/search_sales?p_date_column_filter=shift_date&p_filter_date_start=${date}T00:00:00&p_filter_date_end=${date}T23:59:59&p_limit=1000`

  try {
    const [itemsResult, salesResult] = await Promise.all([
      fetchSaiposComRetry(itemsUrl, token),
      fetchSaiposComRetry(salesUrl, token),
    ])

    if (!itemsResult.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao buscar dados na Saipos', details: itemsResult.details }, { status: itemsResult.status, headers: NO_STORE_HEADERS })
    }
    if (!salesResult.ok) {
      return NextResponse.json({ ok: false, error: 'Erro ao buscar resumo de vendas na Saipos', details: salesResult.details }, { status: salesResult.status, headers: NO_STORE_HEADERS })
    }

    // A Saipos retorna `null` (em vez de []) quando não há vendas no período
    // (ex: logo após a virada de turno, antes do primeiro pedido do dia).
    const now = new Date()
    const pedidos = computePedidosProntos(itemsResult.data || [], salesResult.data || [], { now })

    return NextResponse.json({ ok: true, now: now.toISOString(), janelaMinutos: JANELA_PADRAO_MINUTOS, pedidos }, { headers: NO_STORE_HEADERS })
  } catch (e) {
    console.error('Erro painel-despacho:', e)
    return NextResponse.json({ ok: false, error: e.message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
