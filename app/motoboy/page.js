'use client'
import { useState, useEffect } from 'react'

function getSemana() {
  const hoje = new Date()
  const dia = hoje.getDay()
  let diff = (dia - 3 + 7) % 7
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - diff)
  inicio.setHours(0,0,0,0)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23,59,59,999)
  return { inicio, fim }
}

function getDiasSemana(inicio) {
  const dias = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    dias.push(d)
  }
  return dias
}

function similarity(a, b) {
  a = a.toLowerCase().trim()
  b = b.toLowerCase().trim()
  if (a === b) return 1
  let matches = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) matches++
  }
  return matches / Math.max(a.length, b.length)
}

function groupByName(items) {
  const groups = {}
  items.forEach(item => {
    const nome = item.nome
    let found = Object.keys(groups).find(k => similarity(k, nome) > 0.8)
    if (found) groups[found].push(item)
    else groups[nome] = [item]
  })
  return groups
}

export default function MotoboyPage() {
  const [motoboys, setMotoboys] = useState([])
  const [descontos, setDescontos] = useState([])
  const [loading, setLoading] = useState(true)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState('')

  const loadData = async () => {
    try {
      const [m, d] = await Promise.all([
        fetch('/api/motoboys').then(r => r.json()),
        fetch('/api/descontos').then(r => r.json()),
      ])
      if (m.ok) setMotoboys(m.data)
      if (d.ok) setDescontos(d.data)
      setUltimaAtualizacao(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }))
    } catch (e) {}
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const { inicio, fim } = getSemana()
  const dias = getDiasSemana(inicio)

  const filtrarSemana = (items) => items.filter(i => {
    const d = new Date(i.data); d.setHours(12)
    return d >= inicio && d <= fim
  })

  const motoboysSemana = filtrarSemana(motoboys)
  const descontosSemana = filtrarSemana(descontos)

  const grupos = groupByName(motoboysSemana)
  const nomeDia = (d) => ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][d.getDay()]

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4 },
    body: { padding: '20px 16px' },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '16px', marginBottom: 12 },
    nome: { fontSize: 16, fontWeight: 700, color: '#1a1a18', marginBottom: 10 },
    row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '0.5px solid #f0efe9' },
    badge: (pago) => ({ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pago ? '#eaf3de' : '#fff7e6', color: pago ? '#3b6d11' : '#b45309' }),
    badgeOff: { padding: '3px 10px', borderRadius: 20, fontSize: 11, background: '#f3f2ee', color: '#b4b2a9' },
    atualiza: { fontSize: 12, color: '#888780', textAlign: 'center', marginTop: 16 },
    emptyState: { textAlign: 'center', padding: '40px 20px', color: '#888780' },
    sectionTitle: { fontSize: 11, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
  }

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>💰 Pagamentos Motoboys</h1>
        <div style={st.subtitle}>Semana: {inicio.toLocaleDateString('pt-BR')} — {fim.toLocaleDateString('pt-BR')}</div>
      </div>
      <div style={st.body}>
        {loading && <div style={st.emptyState}>Carregando...</div>}
        {!loading && Object.keys(grupos).length === 0 && (
          <div style={st.emptyState}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
            <div>Nenhum lançamento esta semana ainda.</div>
          </div>
        )}
        {Object.entries(grupos).map(([nome, lancs]) => {
          const descs = descontosSemana.filter(d => similarity(d.nome, nome) > 0.8)
          const bruto = lancs.reduce((a, l) => a + parseFloat(l.valor), 0)
          const totalDesc = descs.reduce((a, d) => a + parseFloat(d.valor), 0)
          const liquido = bruto - totalDesc
          const pg = lancs.every(l => l.pago)

          return (
            <div key={nome} style={st.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={st.nome}>🛵 {nome}</div>
                <span style={st.badge(pg)}>{pg ? '✅ Pago' : '⏳ Pendente'}</span>
              </div>

              <div style={st.sectionTitle}>Dias da semana</div>
              {dias.map(dia => {
                const diaStr = dia.toISOString().split('T')[0]
                const lanc = lancs.find(l => {
                  const fd = new Date(l.data); fd.setHours(12)
                  return fd.toISOString().split('T')[0] === diaStr
                })
                return (
                  <div key={diaStr} style={st.row}>
                    <div style={{ fontSize: 13, color: '#1a1a18' }}>
                      {nomeDia(dia)} {dia.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </div>
                    {lanc
                      ? <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a18' }}>R$ {parseFloat(lanc.valor).toFixed(2)}</span>
                      : <span style={st.badgeOff}>Não trabalhou</span>
                    }
                  </div>
                )
              })}

              {descs.length > 0 && (
                <>
                  <div style={st.sectionTitle}>Vales/descontos</div>
                  {descs.map(d => (
                    <div key={d.id} style={st.row}>
                      <span style={{ fontSize: 13, color: '#a32d2d' }}>{d.motivo || 'Desconto'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#a32d2d' }}>-R$ {parseFloat(d.valor).toFixed(2)}</span>
                    </div>
                  ))}
                </>
              )}

              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e5e0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780' }}>
                  <span>Bruto</span><span>R$ {bruto.toFixed(2)}</span>
                </div>
                {totalDesc > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a32d2d' }}>
                    <span>Descontos</span><span>-R$ {totalDesc.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: liquido >= 0 ? '#1a1a18' : '#a32d2d', marginTop: 6 }}>
                  <span>💰 Líquido</span><span>R$ {liquido.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div style={st.atualiza}>🔄 Atualiza a cada 30s • última: {ultimaAtualizacao}</div>
      </div>
    </div>
  )
}