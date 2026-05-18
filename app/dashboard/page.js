'use client'
import { useState, useEffect } from 'react'

export default function Dashboard() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/saipos')
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
  }

  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 120000) // 2 minutos
    return () => clearInterval(interval)
  }, [])

  const st = {
    wrap: { maxWidth: 800, margin: '0 auto', padding: '0 0 60px', fontFamily: "'DM Sans', system-ui, sans-serif", background: '#f8f7f4', minHeight: '100vh' },
    header: { background: '#1a1a18', padding: '24px 20px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4, color: '#D85A30' },
    title: { fontSize: 26, fontWeight: 700, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 6 },
    body: { padding: '20px' },
    card: { background: '#fff', borderRadius: 16, border: '1px solid #e5e5e0', padding: '24px', marginBottom: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
    kpiCard: { background: '#fff', borderRadius: 16, border: '1px solid #e5e5e0', padding: '20px', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' },
    kpiLabel: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5 },
    kpiValue: { fontSize: 32, fontWeight: 800, color: '#1a1a18' },
    kpiSub: { fontSize: 12, color: '#888780' },
    sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a18', marginBottom: 20 },
    barContainer: { display: 'flex', flexDirection: 'column', gap: 16 },
    barRow: { display: 'flex', alignItems: 'center', gap: 12 },
    barLabel: { width: 110, fontSize: 14, fontWeight: 600, color: '#1a1a18', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
    barTrack: { flex: 1, height: 12, background: '#f3f2ee', borderRadius: 6, overflow: 'hidden' },
    barFill: (perc) => ({ width: `${perc}%`, height: '100%', background: '#D85A30', borderRadius: 6, transition: 'width 1s ease-in-out' }),
    barValue: { width: 90, fontSize: 14, fontWeight: 700, color: '#1a1a18', textAlign: 'right' },
    tableRow: { display: 'grid', gridTemplateColumns: '50px 1fr 100px 90px', gap: 12, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #f0efe9', fontSize: 14 },
    badge: (cancelado) => ({ display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: cancelado ? '#fcebeb' : '#f3f2ee', color: cancelado ? '#a32d2d' : '#888780', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }),
  }

  if (loading && !dados) return (
    <div style={st.wrap}>
      <div style={st.header}><div style={st.logo}>#VEM PRA MANET</div><h1 style={st.title}>Monitor de Vendas</h1></div>
      <div style={{ padding: 40, textAlign: 'center', color: '#888780' }}>Carregando dashboard em tempo real...</div>
    </div>
  )

  if (erro) return (
    <div style={st.wrap}>
      <div style={st.header}><div style={st.logo}>#VEM PRA MANET</div><h1 style={st.title}>Monitor de Vendas</h1></div>
      <div style={{ padding: 40, textAlign: 'center', color: '#a32d2d', fontWeight: 600 }}>{erro}</div>
    </div>
  )

  const { resumo, ultimos, shiftDate } = dados
  const totalGeral = resumo.totalVendas || 0
  const totalFormatado = totalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const ticketFormatado = resumo.ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Monitor de Vendas</h1>
        <div style={st.subtitle}>
          Turno Operacional: {shiftDate.split('-').reverse().join('/')} <br/>
          Última atualização: {lastUpdate?.toLocaleTimeString('pt-BR', { hour: '2-digit', minute:'2-digit', second:'2-digit' })}
        </div>
      </div>

      <div style={st.body}>
        <div style={st.grid}>
          <div style={st.kpiCard}>
            <div style={st.kpiLabel}>💰 Faturamento Diário</div>
            <div style={st.kpiValue}>{totalFormatado}</div>
            <div style={st.kpiSub}>Vendas aprovadas hoje</div>
          </div>
          <div style={st.kpiCard}>
            <div style={st.kpiLabel}>📦 Pedidos</div>
            <div style={st.kpiValue}>{resumo.quantidadePedidos}</div>
            <div style={st.kpiSub}>Volume total de entregas/balcão</div>
          </div>
          <div style={st.kpiCard}>
            <div style={st.kpiLabel}>📈 Ticket Médio</div>
            <div style={st.kpiValue}>{ticketFormatado}</div>
            <div style={st.kpiSub}>Gasto médio por cliente</div>
          </div>
        </div>

        <div style={st.card}>
          <h2 style={st.sectionTitle}>Vendas por Canal</h2>
          <div style={st.barContainer}>
            {resumo.canais.length === 0 && <div style={{ color: '#888780', fontSize: 14 }}>Nenhuma venda registrada hoje.</div>}
            {resumo.canais.map(c => {
              const perc = totalGeral > 0 ? (c.valor / totalGeral) * 100 : 0
              return (
                <div key={c.nome} style={st.barRow}>
                  <div style={st.barLabel}>{c.nome}</div>
                  <div style={st.barTrack}>
                    <div style={st.barFill(perc)}></div>
                  </div>
                  <div style={{ width: 45, fontSize: 12, color: '#888780', textAlign: 'right' }}>{c.quantidade} ped</div>
                  <div style={st.barValue}>{c.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={st.card}>
          <h2 style={st.sectionTitle}>Últimos Pedidos em Tempo Real</h2>
          {ultimos.length === 0 && <div style={{ color: '#888780', fontSize: 14 }}>Nenhum pedido recente.</div>}
          {ultimos.length > 0 && (
            <div>
              <div style={{ ...st.tableRow, color: '#888780', fontWeight: 600, borderBottom: '2px solid #e5e5e0', paddingBottom: 10, paddingTop: 0 }}>
                <div>Hora</div>
                <div>Cliente</div>
                <div style={{ textAlign: 'center' }}>Canal</div>
                <div style={{ textAlign: 'right' }}>Valor</div>
              </div>
              {ultimos.map(u => (
                <div key={u.id} style={{ ...st.tableRow, opacity: u.cancelado ? 0.6 : 1 }}>
                  <div style={{ fontWeight: 600, color: '#1a1a18' }}>{u.hora}</div>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, color: u.cancelado ? '#a32d2d' : '#1a1a18' }}>
                    {u.cancelado ? '❌ ' : ''}{u.cliente}
                  </div>
                  <div><span style={st.badge(u.cancelado)}>{u.canal}</span></div>
                  <div style={{ fontWeight: 700, color: u.cancelado ? '#a32d2d' : '#3b6d11', textAlign: 'right' }}>
                    {u.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
