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
// Sai do painel assim que a 99Food reportar DISPATCHED/CONCLUDED (motoboy
// retirou/concluiu) OU por tempo (JANELA_PADRAO_MINUTOS), o que vier
// primeiro — sem cache em lugar nenhum da cadeia, cada poll recalcula do
// zero, então a remoção reflete o próximo poll depois do evento real.
//
// Confirmado com pedido real (diff campo a campo do MESMO id_sale em dois
// instantes 20min apart, um deles já certamente retirado): pra iFood,
// literalmente nenhum campo muda além de updated_at (ruído, sem relação com
// entrega) — partner_status trava em PLACED pra sempre (~90 pedidos reais
// confirmam), delivery_man e partner_delivery nunca vêm preenchidos pra
// pedido de parceiro (só aparecem em pedido de frota própria, sem
// partner_sale). Não existe outro endpoint na API da Saipos com esse dado
// (testados ~15 nomes de endpoint alternativos, todos 404). Pra esse canal
// só o tempo funciona mesmo — não é bug, é limitação real de dado.
//
// Pra 99Food, DISPATCHED/CONCLUDED é real e a maioria (61% numa amostra de
// 36 pedidos) chega dentro dos 18min da janela.

const CANAIS_PAINEL = new Set(['iFood', '99 Food'])
const JANELA_PADRAO_MINUTOS = 18
const STATUS_JA_RETIRADO = new Set(['DISPATCHED', 'CONCLUDED'])

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

    if (STATUS_JA_RETIRADO.has(sale.partner_sale?.partner_status)) continue

    const itens = (saleItems.items || []).filter(it => it.deleted !== 'Y')
    if (itens.length === 0) continue

    const todosProntos = itens.every(it => it.status === 1 && it.done_at)
    if (!todosProntos) continue

    const readyAtMs = Math.max(...itens.map(it => parseSaiposTimestamp(it.done_at).getTime()))
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
