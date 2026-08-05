// Resumo financeiro/canal a partir do endpoint search_sales da Saipos.

function computeResumoVendas(salesData) {
  let totalVendas = 0
  let quantidadePedidos = 0
  let pedidosCancelados = 0
  let pedidosAguardandoColeta = 0
  const canaisObj = {}

  const vendasAtivas = salesData.filter(v => v.canceled === 'N')

  salesData.forEach(v => {
    if (v.canceled === 'S') pedidosCancelados++
  })

  vendasAtivas.forEach(v => {
    totalVendas += v.total_amount || 0
    quantidadePedidos++

    const canalStr = v.partner_sale?.desc_partner_sale || 'Loja Própria'
    if (!canaisObj[canalStr]) canaisObj[canalStr] = { valor: 0, quantidade: 0 }
    canaisObj[canalStr].valor += v.total_amount || 0
    canaisObj[canalStr].quantidade++

    // READY_TO_DELIVER só aparece de forma confiável pra pedidos 99Food; iFood
    // trava em PLACED (nunca atualiza) e loja própria/balcão não tem esse campo
    if (v.partner_sale?.partner_status === 'READY_TO_DELIVER') {
      pedidosAguardandoColeta++
    }
  })

  const canais = Object.keys(canaisObj)
    .map(nome => ({ nome, valor: canaisObj[nome].valor, quantidade: canaisObj[nome].quantidade }))
    .sort((a, b) => b.valor - a.valor)

  const ticketMedio = quantidadePedidos > 0 ? totalVendas / quantidadePedidos : 0

  return { totalVendas, quantidadePedidos, ticketMedio, canais, pedidosCancelados, pedidosAguardandoColeta }
}

export { computeResumoVendas }
