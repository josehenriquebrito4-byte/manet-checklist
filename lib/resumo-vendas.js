// Resumo financeiro/canal a partir do endpoint search_sales da Saipos.

function computeResumoVendas(salesData) {
  let totalVendas = 0
  let quantidadePedidos = 0
  const canaisObj = {}

  const vendasAtivas = salesData.filter(v => v.canceled === 'N')

  vendasAtivas.forEach(v => {
    totalVendas += v.total_amount || 0
    quantidadePedidos++

    const canalStr = v.partner_sale?.desc_partner_sale || 'Loja Própria'
    if (!canaisObj[canalStr]) canaisObj[canalStr] = { valor: 0, quantidade: 0 }
    canaisObj[canalStr].valor += v.total_amount || 0
    canaisObj[canalStr].quantidade++
  })

  const canais = Object.keys(canaisObj)
    .map(nome => ({ nome, valor: canaisObj[nome].valor, quantidade: canaisObj[nome].quantidade }))
    .sort((a, b) => b.valor - a.valor)

  const ticketMedio = quantidadePedidos > 0 ? totalVendas / quantidadePedidos : 0

  return { totalVendas, quantidadePedidos, ticketMedio, canais }
}

export { computeResumoVendas }
