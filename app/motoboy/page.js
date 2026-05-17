'use client'
import { useState, useEffect } from 'react'

function getSemanaAtual() {
  const hoje = new Date()
  const dia = hoje.getDay() // 0=dom, 1=seg, 2=ter, 3=qua, 4=qui, 5=sex, 6=sab
  // Quarta = 3, queremos o início da semana na quarta anterior
  let diff = (dia - 3 + 7) % 7
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - diff)
  inicio.setHours(0,0,0,0)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23,59,59,999)
  return { inicio, fim }
}

function getDiasSemana() {
  const { inicio } = getSemanaAtual()
  const dias = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    dias.push(d)
  }
  return dias
}

export default function Motoboy() {
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')

  const loadData = async () => {
    try {
      const res = await fetch('/api/freelancers')
      const data = await res.json()
      if (data.ok) {
        const { inicio, fim } = getSemanaAtual()
        const motoboys = data.data.filter(f => {
          if (f.funcao !== 'Motoboy') return false
          const d = new Date(f.data)
          d.setHours(12,0,0,0)
          return d >= inicio && d <= fim
        })
        setFreelancers(motoboys)
        setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
      }
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const { inicio, fim } = getSemanaAtual()
  const semanaLabel = `${inicio.toLocaleDateString('pt-BR')} - ${fim.toLocaleDateString('pt-BR')}`
  const dias = getDiasSemana()

  const agrupado = freelancers.reduce((acc, f) => {
    if (!acc[f.nome]) acc[f.nome] = []
    acc[f.nome].push(f)
    return acc
  }, {})

  const nomeDia = (d) => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4 },
    body: { padding: '20px 16px' },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '16px', marginBottom: 12 },
    nome: { fontSize: 16, fontWeight: 600, color: '#1a1a18', marginBottom: 8 },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '0.5px solid #f0efe9' },
    badge: (pago) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pago ? '#eaf3de' : '#fff7e6', color: pago ? '#3b6d11' : '#b45309' }),
    badgeOff: { padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: '#f3f2ee', color: '#b4b2a9' },
    atualiza: { fontSize: 12, color: '#888780', textAlign: 'center', marginTop: 16 },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#888780' },
  }

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>💰 Pagamentos Motoboys</h1>
        <div style={st.subtitle}>Semana: {semanaLabel}</div>
      </div>
      <div style={st.body}>
        {loading && <div style={st.emptyState}>Carregando...</div>}
        {!loading && Object.keys(agrupado).length === 0 && (
          <div style={st.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
            <div>Nenhum lançamento esta semana ainda.</div>
          </div>
        )}
        {Object.entries(agrupado).map(([nome, lancamentos]) => {
          const totalPendente = lancamentos.filter(f => !f.pago).reduce((acc, f) => acc + parseFloat(f.valor), 0)
          const totalPago = lancamentos.filter(f => f.pago).reduce((acc, f) => acc + parseFloat(f.valor), 0)
          const total = totalPendente + totalPago

          return (
            <div key={nome} style={st.card}>
              <div style={st.nome}>🛵 {nome}</div>
              {dias.map(dia => {
                const diaStr = dia.toISOString().split('T')[0]
                const lanc = lancamentos.find(f => {
                  const fd = new Date(f.data)
                  fd.setHours(12,0,0,0)
                  return fd.toISOString().split('T')[0] === diaStr
                })
                return (
                  <div key={diaStr} style={st.row}>
                    <div>
                      <div style={{ fontSize: 13, color: '#1a1a18', fontWeight: 500 }}>
                        {nomeDia(dia)} {dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </div>
                      {lanc && <div style={{ fontSize: 12, color: '#888780' }}>R$ {parseFloat(lanc.valor).toFixed(2)}</div>}
                    </div>
                    {lanc
                      ? <span style={st.badge(lanc.pago)}>{lanc.pago ? '✅ Pago' : '⏳ Pendente'}</span>
                      : <span style={st.badgeOff}>Não trabalhou</span>
                    }
                  </div>
                )
              })}
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0efe9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780' }}>
                  <span>Total da semana</span>
                  <span style={{ fontWeight: 600, color: '#1a1a18' }}>R$ {total.toFixed(2)}</span>
                </div>
                {totalPendente > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                    <span style={{ color: '#b45309' }}>A receber</span>
                    <span style={{ fontWeight: 700, color: '#D85A30' }}>R$ {totalPendente.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div style={st.atualiza}>🔄 Atualiza automaticamente • última: {ultimaAtualizacao}</div>
      </div>
    </div>
  )
}