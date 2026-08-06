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
// Sai do painel assim que o Kanban do Saipos mover o pedido pra além de
// "Aguardando Entrega" (motoboy retirou) OU por tempo (JANELA_PADRAO_MINUTOS),
// o que vier primeiro — sem cache em lugar nenhum da cadeia, cada poll
// recalcula do zero, então a remoção reflete o próximo poll depois do
// evento real.
//
// O sinal de retirada NÃO é o partner_status do iFood (trava em PLACED pra
// sempre, confirmado em ~90 pedidos reais) nem delivery_man/partner_delivery
// (nunca preenchidos pra pedido de parceiro — só em entrega de frota
// própria, sem partner_sale). É o próprio updated_at da venda: toda vez que
// o Kanban move o card, a Saipos re-grava a linha e updated_at avança de
// novo — mesmo quando o iFood não ecoa isso de volta pro partner_status.
// Validado cruzando com o partner_status da 99Food (que é confiável): nos
// 36 pedidos 99Food de uma amostra real, updated_at == done_at (delta 0)
// em 100% dos casos ainda READY_TO_DELIVER, e updated_at > done_at em
// 100% dos casos já DISPATCHED/CONCLUDED — sem exceção. Pro iFood a mesma
// divergência aparece com magnitude realista de tempo de entrega (a
// maioria 10-40min), então vale o mesmo mecanismo.

const CANAIS_PAINEL = new Set(['iFood', '99 Food'])
const JANELA_PADRAO_MINUTOS = 18
// margem pra absorver pequeno desalinhamento de escrita entre done_at e
// updated_at no exato momento em que o pedido fica pronto (não é a mesma
// coluna, podem gravar com milissegundos de diferença).
const TOLERANCIA_RETIRADA_MS = 60 * 1000

// A Saipos retorna timestamps sem timezone (ex: "2026-08-05T13:17:13"),
// sempre no horário de Brasília. Sem forçar o offset aqui, o parsing usa o
// fuso do processo Node — em produção (container Docker em UTC) isso
// deslocava done_at em 3h e derrubava todo pedido pra fora da janela.
function parseSaiposTimestamp(str) {
  return new Date(`${str}-03:00`)
}

/**
 * @returns {Array<{ idSale: number, saleNumber: number, pedidoReal: string,
 *   canal: string, readyAt: string }>}
 */
function computePedidosProntos(salesItemsResponse, salesData, {
  now = new Date(),
  janelaMinutos = JANELA_PADRAO_MINUTOS,
} = {}) {
  const salesById = new Map(salesData.map(s => [s.id_sale, s]))

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

    const topUpdatedMs = parseSaiposTimestamp(sale.updated_at).getTime()
    if (topUpdatedMs > readyAtMs + TOLERANCIA_RETIRADA_MS) continue // Kanban já moveu pra além de Aguardando Entrega

    const idadeMinutos = (now.getTime() - readyAtMs) / 60000
    if (idadeMinutos > janelaMinutos) continue

    pedidos.push({
      idSale: sale.id_sale,
      saleNumber: sale.sale_number,
      // número do pedido como aparece no app do iFood/99Food (o que o
      // cliente/motoboy reconhece) — cai pro nosso sale_number se faltar.
      pedidoReal: sale.partner_sale?.cod_sale2 || String(sale.sale_number),
      canal,
      readyAt: new Date(readyAtMs).toISOString(),
    })
  }

  pedidos.sort((a, b) => new Date(a.readyAt) - new Date(b.readyAt))
  return pedidos
}

export { computePedidosProntos, JANELA_PADRAO_MINUTOS }
