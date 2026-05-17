'use client'
import { useState, useRef } from 'react'

const FORNECEDORES = [
  { key: 'trembao', label: 'Trembaão' },
  { key: 'pedrao', label: 'Pedrão (Sacolão)' },
  { key: 'cadeg', label: 'CADEG' },
  { key: 'embalagens', label: 'Embalagens' },
  { key: 'felipao', label: 'Felipão da Penha' },
  { key: 'atacadao', label: 'Atacadão' },
  { key: 'ambev', label: 'Ambev' },
  { key: 'mineiro', label: 'Mineiro Queijos' },
  { key: 'outras', label: 'Outras Compras' },
  { key: 'deposito', label: 'Depósito' },
  { key: 'bigs', label: 'Bigs Batata Recheada' },
  { key: 'combustivel', label: 'Combustível e Alimentação' },
]

export default function ChecklistCompras() {
  const [nome, setNome] = useState('')
  const [valores, setValores] = useState({})
  const [concluido, setConcluido] = useState(false)
  const [pendente, setPendente] = useState(false)
  const [fotos, setFotos] = useState({})
  const [enviando, setEnviando] = useState(false)
  const fotoRef = useRef()

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const handleFoto = async (file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setFotos({ file, url, mime: file.type })
  }

  const podeEnviar = nome.trim() && fotos.url && !enviando

  const handleEnviar = async () => {
    if (!podeEnviar) return
    setEnviando(true)
    try {
      await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome, tipo: 'compras', turno: 'diario', tarefas: {},
          resultados: {},
          extras: { valores, concluido, pendente }
        })
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
    submitBtn: { width: '100%', padding: '14px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    submitBtnDis: { width: '100%', padding: '14px', borderRadius: 12, background: '#f3f2ee', color: '#b4b2a9', fontSize: 16, fontWeight: 600, border: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
    uploadBtn: { width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #d5d3cc', background: '#faf9f6', fontSize: 13, color: '#888780', cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" },
    preview: { width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 180, objectFit: 'cover' },
    radioRow: { display: 'flex', gap: 12, marginTop: 8 },
    radioBtn: (selected) => ({ flex: 1, padding: '10px', borderRadius: 8, border: selected ? 'none' : '1px solid #d5d3cc', background: selected ? '#D85A30' : '#fff', color: selected ? '#fff' : '#1a1a18', fontSize: 14, fontWeight: 500, cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" }),
  }

  if (concluido) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Controle de Compras</h1>
      </div>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a18', marginBottom: 8 }}>Compras registradas!</div>
        <div style={{ fontSize: 14, color: '#888780', marginBottom: 24 }}>Relatório enviado para o gestor.</div>
        <button onClick={() => { setNome(''); setValores({}); setFotos({}); setConcluido(false) }} style={{ ...st.submitBtn, background: '#1a1a18' }}>Novo Registro</button>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Controle de Compras</h1>
        <div style={st.subtitle}>Registro diário</div>
      </div>
      <div style={st.body}>
        <div style={{ marginBottom: 20 }}>
          <label style={st.label}>Seu nome</label>
          <input style={st.input} placeholder="Ex: João Silva" value={nome} onChange={e => setNome(e.target.value)} />
        </div>
        <div style={st.sectionTitle}>💰 Valores por fornecedor</div>
        <div style={st.card}>
          {FORNECEDORES.map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <label style={st.label}>{label}</label>
              <input style={st.input} type="number" placeholder="R$ 0,00" value={valores[key] || ''} onChange={e => setValores(v => ({ ...v, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div style={st.sectionTitle}>✅ Pedido concluído?</div>
        <div style={st.card}>
          <div style={st.radioRow}>
            <button style={st.radioBtn(!pendente)} onClick={() => setPendente(false)}>✅ Sim, finalizado!</button>
            <button style={st.radioBtn(pendente)} onClick={() => setPendente(true)}>⚠️ Ficou pendente</button>
          </div>
        </div>
        <div style={st.sectionTitle}>📷 Foto das notas</div>
        <div style={st.card}>
          <input ref={fotoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFoto(e.target.files[0])} />
          <button style={st.uploadBtn} onClick={() => fotoRef.current?.click()}>{fotos.url ? '📷 Trocar foto' : '📷 Tirar foto das notas'}</button>
          {fotos.url && <img src={fotos.url} alt="Notas" style={st.preview} />}
        </div>
        <button style={podeEnviar ? st.submitBtn : st.submitBtnDis} onClick={handleEnviar} disabled={!podeEnviar}>
          {enviando ? 'Enviando...' : !nome.trim() ? 'Coloque seu nome' : !fotos.url ? 'Tire foto das notas' : '📤 Enviar Compras'}
        </button>
      </div>
    </div>
  )
}