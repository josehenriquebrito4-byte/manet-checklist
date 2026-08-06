'use client'
import { useState, useEffect, useCallback } from 'react'

function hojeSaoPaulo() {
  const now = new Date()
  const brTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
  if (brTime.getHours() < 6) brTime.setDate(brTime.getDate() - 1)
  const yyyy = brTime.getFullYear()
  const mm = String(brTime.getMonth() + 1).padStart(2, '0')
  const dd = String(brTime.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function ConsumoTeorico() {
  const [date, setDate] = useState(hojeSaoPaulo())
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)
  const [saboresAberto, setSaboresAberto] = useState(false)
  const [insumosAberto, setInsumosAberto] = useState(false)

  const fetchConsumo = useCallback(async (d) => {
    try {
      const res = await fetch(`/api/consumo-teorico?date=${d}`)
      const result = await res.json()
      if (result.ok) {
        setDados(result)
        setLastUpdate(new Date())
        setErro('')
      } else {
        setErro(result.error || 'Erro ao carregar dados')
      }
    } catch (e) {
      setErro('Falha de conexão com a API local')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setDados(null)
    fetchConsumo(date)
    const interval = setInterval(() => fetchConsumo(date), 30000) // 30s
    return () => clearInterval(interval)
  }, [date, fetchConsumo])

  const st = {
    wrap: { maxWidth: 800, margin: '0 auto', padding: '0 0 60px', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f8f7f4', minHeight: '100vh' },
    header: { background: '#1a1a18', padding: '24px 20px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4, color: '#D85A30' },
    title: { fontSize: 26, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 6 },
    dateRow: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 },
    dateInput: { padding: '8px 12px', borderRadius: 8, border: 'none', fontSize: 14, fontFamily: "'DM Sans', system-ui, sans-serif" },
    todayBtn: { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#D85A30', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
    body: { padding: '20px' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 },
    kpiCard: { background: '#fff', borderRadius: 16, border: '1px solid #e5e5e0', padding: '24px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    kpiLabel: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5 },
    kpiValue: { fontSize: 40, fontWeight: 800, color: '#1a1a18' },
    kpiSub: { fontSize: 12, color: '#888780' },
    card: { background: '#fff', borderRadius: 16, border: '1px solid #e5e5e0', padding: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a18', marginBottom: 16 },
    tableRow: { display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0efe9', fontSize: 14 },
    saboresBtn: { width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid #e5e5e0', borderRadius: 16, padding: '18px 24px', fontSize: 16, fontWeight: 700, color: '#1a1a18', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    saboresChevron: { fontSize: 13, color: '#888780', fontWeight: 600 },
    saboresPanel: { background: '#fff', borderRadius: 16, border: '1px solid #e5e5e0', borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: '8px 24px 20px' },
  }

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Consumo Teórico de Insumos</h1>
        <div style={st.subtitle}>
          Última atualização: {lastUpdate ? lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
        </div>
        <div style={st.dateRow}>
          <input type="date" value={date} max={hojeSaoPaulo()} onChange={e => setDate(e.target.value)} style={st.dateInput} />
          {date !== hojeSaoPaulo() && (
            <button style={st.todayBtn} onClick={() => setDate(hojeSaoPaulo())}>Hoje</button>
          )}
        </div>
      </div>

      <div style={st.body}>
        {loading && !dados && (
          <div style={{ padding: 40, textAlign: 'center', color: '#888780' }}>Carregando consumo teórico...</div>
        )}

        {erro && (
          <div style={{ padding: 20, textAlign: 'center', color: '#a32d2d', fontWeight: 600 }}>{erro}</div>
        )}

        {dados && (
          <>
            <div style={st.grid}>
              <div style={st.kpiCard}>
                <div style={st.kpiLabel}>🧾 Pedidos</div>
                <div style={st.kpiValue}>{dados.quantidadePedidos}</div>
                <div style={st.kpiSub}>
                  Ticket médio {dados.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div style={st.kpiCard}>
                <div style={st.kpiLabel}>💰 Faturamento</div>
                <div style={st.kpiValue}>
                  {dados.totalVendas.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <div style={st.kpiSub}>Soma dos pedidos não cancelados</div>
              </div>
              <div style={st.kpiCard}>
                <div style={st.kpiLabel}>🍕 Pizzas vendidas</div>
                <div style={st.kpiValue}>{dados.totalPizzas}</div>
                <div style={st.kpiSub}>{dados.totalSalgadas} salgadas (30cm) + {dados.totalBrotos} brotos doces (20cm)</div>
              </div>
              <div style={st.kpiCard}>
                <div style={st.kpiLabel}>❌ Cancelados</div>
                <div style={st.kpiValue}>{dados.pedidosCancelados}</div>
                <div style={st.kpiSub}>Pedidos cancelados hoje</div>
              </div>
            </div>

            <button
              type="button"
              style={{ ...st.saboresBtn, marginBottom: 16 }}
              onClick={() => setInsumosAberto(v => !v)}
              aria-expanded={insumosAberto}
            >
              <span>🧾 Insumos</span>
              <span style={st.saboresChevron}>{insumosAberto ? 'ocultar ▲' : 'ver detalhes ▼'}</span>
            </button>
            {insumosAberto && (
              <div style={{ ...st.saboresPanel, marginBottom: 16 }}>
                <div style={{ ...st.grid, marginBottom: 0, paddingTop: 12 }}>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🧀 Muçarela</div>
                    <div style={st.kpiValue}>{dados.mussarelaKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>{dados.totalSalgadas} pizzas salgadas (30cm)</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🌶️ Calabresa</div>
                    <div style={st.kpiValue}>{dados.calabresaKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Só sabor Calabresa, Manet e Portuguesa (consumo real)</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🧈 Catupiry</div>
                    <div style={st.kpiValue}>{dados.catupiryKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Frango, Duqueza, 5 Queijos e Caprichosa</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🍗 Frango</div>
                    <div style={st.kpiValue}>{dados.frangoKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Pizza Frango</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🥓 Presunto</div>
                    <div style={st.kpiValue}>{dados.presuntoKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Pizza Portuguesa</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🥓 Bacon</div>
                    <div style={st.kpiValue}>{dados.baconKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Duqueza e Caprichosa</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🧀 Gorgonzola</div>
                    <div style={st.kpiValue}>{dados.gorgonzolaKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Manet e 5 Queijos</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🍅 Tomate</div>
                    <div style={st.kpiValue}>{dados.tomateKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Pizza Marguerita</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🧅 Cebola</div>
                    <div style={st.kpiValue}>{dados.cebolaKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg</div>
                    <div style={st.kpiSub}>Calabresa e Portuguesa</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>📦 Caixas</div>
                    <div style={st.kpiValue}>{dados.caixaTotal}</div>
                    <div style={st.kpiSub}>{dados.caixa30cm} de 30cm + {dados.caixa20cm} de 20cm</div>
                  </div>
                  <div style={st.kpiCard}>
                    <div style={st.kpiLabel}>🥤 Refrigerantes</div>
                    <div style={st.kpiValue}>{dados.refrigerantes}</div>
                    <div style={st.kpiSub}>{dados.totalCombos} combos vendidos (1 refri cada)</div>
                  </div>
                </div>
                {dados.calabresaFallbackKg > 0 && (
                  <div style={{ fontSize: 12, color: '#888780', paddingTop: 14 }}>
                    + {dados.calabresaFallbackKg.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })} kg aproximados em sabores sem ficha própria (ex: Predileta, Palmito) — usado só como referência de custo, não entra no consumo real de calabresa acima.
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              style={st.saboresBtn}
              onClick={() => setSaboresAberto(v => !v)}
              aria-expanded={saboresAberto}
            >
              <span>🍕 Sabores</span>
              <span style={st.saboresChevron}>{saboresAberto ? 'ocultar ▲' : 'ver detalhes ▼'}</span>
            </button>
            {saboresAberto && (
              <div style={st.saboresPanel}>
                {Object.entries(dados.porFicha).sort((a, b) => b[1] - a[1]).map(([ficha, qtd]) => (
                  <div key={ficha} style={st.tableRow}>
                    <div style={{ fontWeight: 500, color: '#1a1a18' }}>{ficha}</div>
                    <div style={{ textAlign: 'right', color: '#888780' }}>{qtd} pizza{qtd !== 1 ? 's' : ''}</div>
                  </div>
                ))}
                {Object.keys(dados.porFicha).length === 0 && (
                  <div style={{ color: '#888780', fontSize: 14, paddingTop: 10 }}>Nenhuma pizza salgada registrada nesse dia.</div>
                )}
              </div>
            )}

            <div style={{ ...st.card, marginTop: 16 }}>
              <h2 style={st.sectionTitle}>Pedidos por canal</h2>
              {dados.canais.map(c => (
                <div key={c.nome} style={st.tableRow}>
                  <div style={{ fontWeight: 500, color: '#1a1a18' }}>{c.nome}</div>
                  <div style={{ textAlign: 'right', color: '#888780' }}>
                    {c.quantidade} · {c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                </div>
              ))}
              {dados.canais.length === 0 && (
                <div style={{ color: '#888780', fontSize: 14 }}>Nenhum pedido registrado nesse dia.</div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
