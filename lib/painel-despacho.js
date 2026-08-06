// Painel de despacho: pedidos prontos para retirada pelo motoboy parceiro.
//
// "Pronto" = todo item não deletado da venda tem status 1 (o Kanban interno
// da cozinha moveu o pedido de "Produção" pra "Aguardando Entrega"). Esse
// evento é o mesmo que dispara "pronto" pros apps do iFood/99Food — validado
// cruzando com o partner_status READY_TO_DELIVER da 99Food (bate ao segundo).
//
// Itens da mesma venda sempre têm o mesmo done_at (o card do Kanban move o
// pedido inteiro de uma vez, não pizza por pizza), mas por segurança usamos
// o maior done_at entre os itens como o momento em que o pedido ficou pronto.
//
// Sai do painel sozinho depois de JANELA_PADRAO_MINUTOS: não há sinal
// confiável de "motoboy já retirou" (CONCLUDED demora ~30-40min e não existe
// pro iFood), então assumimos retirada dentro da janela.

const CANAIS_PAINEL = new Set(['iFood', '99 Food'])
const JANELA_PADRAO_MINUTOS = 18

function tituloCase(nome) {
  return (nome || '')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// A Saipos retorna timestamps sem timezone (ex: "2026-08-05T13:17:13"),
// sempre no horário de Brasília. Sem forçar o offset aqui, o parsing usa o
// fuso do processo Node — em produção (container Docker em UTC) isso
// deslocava done_at em 3h e derrubava todo pedido pra fora da janela.
function parseSaiposTimestamp(str) {
  return new Date(`${str}-03:00`)
}

/**
 * @returns {Array<{ idSale: number, saleNumber: number, cliente: string,
 *   canal: string, readyAt: string, itens: string[] }>}
 */
function computePedidosProntos(salesItemsResponse, salesData, { now = new Date(), janelaMinutos = JANELA_PADRAO_MINUTOS } = {}) {
  const salesById = new Map(salesData.map(s => [s.id_sale, s]))
  const limiteMs = now.getTime() - janelaMinutos * 60000

  const pedidos = []

  for (const saleItems of salesItemsResponse) {
    const sale = salesById.get(saleItems.id_sale)
    if (!sale || sale.canceled === 'Y') continue

    const canal = sale.partner_sale?.desc_partner_sale
    if (!CANAIS_PAINEL.has(canal)) continue

    const itens = (saleItems.items || []).filter(it => it.deleted !== 'Y')
    if (itens.length === 0) continue

    const todosProntos = itens.every(it => it.status === 1 && it.done_at)
    if (!todosProntos) continue

    const readyAtMs = Math.max(...itens.map(it => parseSaiposTimestamp(it.done_at).getTime()))
    if (readyAtMs < limiteMs) continue

    pedidos.push({
      idSale: sale.id_sale,
      saleNumber: sale.sale_number,
      cliente: tituloCase(sale.customer?.name) || 'Cliente',
      canal,
      readyAt: new Date(readyAtMs).toISOString(),
      itens: itens.map(it => it.desc_sale_item).filter(Boolean),
    })
  }

  pedidos.sort((a, b) => new Date(a.readyAt) - new Date(b.readyAt))
  return pedidos
}

export { computePedidosProntos, JANELA_PADRAO_MINUTOS }
