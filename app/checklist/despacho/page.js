'use client'
import { useState } from 'react'

const TAREFAS = [
  { key: 't1', label: 'Retirar falta motoboy' },
  { key: 't2', label: 'Orientar sobre mochilas e máquinas' },
  { key: 't3', label: 'Entrar em contato com faltantes e substituir se necessário' },
  { key: 't4', label: 'Orientar e supervisionar organização da frente de loja' },
  { key: 't5', label: 'Verificar quantidade necessária de caixas e avisar líder garçom' },
  { key: 't6', label: 'Cobrir conferência e despacho até a necessidade da casa' },
  { key: 't7', label: 'Verificar forneiro — quantidade de itens para finalização está OK' },
  { key: 't8', label: 'Organização de toda parte visível perante aos clientes' },
  { key: 't9', label: 'Solicitar lanche dos motoboys o mais cedo possível' },
  { key: 't10', label: 'Passar feedbacks dos motoboys pro responsável de loja' },
  { key: 't11', label: 'Verificar tempo de entrega e projeção de pedidos de 30 em 30 min' },
  { key: 't12', label: 'Solicitar reposição freezers de delivery' },
  { key: 't13', label: 'Ter excelente comunicação com garçons e motoboys' },
  { key: 't14', label: 'Certificar que tudo ao redor na saída está apto e no padrão' },
  { key: 't15', label: 'Informar pelo WhatsApp no grupo COP o OK do formulário' },
]

export default function ChecklistDespacho() {
  const [nome, setNome] = useState('')
  const [tarefas, setTarefas] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)

  const handleTarefa = (key) => setTarefas(t => ({ ...t, [key]: !t[key] }))
  const todasTarefas = TAREFAS.every(t => tarefas[t.key])
  const podeEnviar = nome.trim() && todasTarefas && !enviando

  const handleEnviar = async () => {
    if (!podeEnviar) return
    setEnviando(true)
    try {
      await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, tipo: 'despacho', turno: 'abertura', tarefas, resultados: {} })
      })
      setConcluido(true)
    } catch (e) {}
    setEnviando(false)
  }

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#D85A30', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4 },
    body: { padding: '20px 16px' },
    label: { fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '14px 16px', marginBottom: 12 },
    tarefa: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid #f0efe9', cursor: 'pointer' },
    submitBtn: { width: '100%', padding: '14px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    submitBtnDis: { width: '100%', padding: '14px', borderRadius: 12, background: '#f3f2ee', color: '#b4b2a9', fontSize: 16, fontWeight: 600, border: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
  }

  if (concluido) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Checklist Despacho</h1>
      </div>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a18', marginBottom: 8 }}>Checklist enviado!</div>
        <div style={{ fontSize: 14, color: '#888780', marginBottom: 24 }}>Gerente foi notificada. Bom turno!</div>
        <button onClick={() => { setNome(''); setTarefas({}); setConcluido(false) }} style={{ ...st.submitBtn, background: '#1a1a18' }}>Novo Checklist</button>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Checklist Despacho</h1>
        <div style={st.subtitle}>Abertura de turno — 18h00</div>
      </div>
      <div style={st.body}>
        <div style={{ marginBottom: 20 }}>
          <label style={st.label}>Seu nome</label>
          <input style={st.input} placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div style={st.sectionTitle}>✅ Tarefas</div>
        <div style={st.card}>
          {TAREFAS.map(({ key, label }) => (
            <div key={key} style={st.tarefa} onClick={() => handleTarefa(key)}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: tarefas[key] ? 'none' : '1.5px solid #d5d3cc', background: tarefas[key] ? '#D85A30' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {tarefas[key] && <span style={{ color: '#fff', fontSize: 14 }}>✓</span>}
              </div>
              <span style={{ fontSize: 14, color: tarefas[key] ? '#888780' : '#1a1a18', textDecoration: tarefas[key] ? 'line-through' : 'none' }}>{label}</span>
            </div>
          ))}
        </div>
        <button style={podeEnviar ? st.submitBtn : st.submitBtnDis} onClick={handleEnviar} disabled={!podeEnviar}>
          {enviando ? 'Enviando...' : !nome.trim() ? 'Coloque seu nome' : !todasTarefas ? 'Conclua todas as tarefas' : '📤 Enviar Checklist'}
        </button>
      </div>
    </div>
  )
}