'use client'
import { useState, useRef } from 'react'

const TAREFAS = [
  { key: 't1', label: 'Verificar quantidade de massa batida e a bater — informar ao masseiro' },
  { key: 't2', label: 'Duplo check produção do dia — conferir e sinalizar no grupo de produção' },
  { key: 't3', label: 'Verificar falta de colega em determinada função e avisar chef cozinha' },
  { key: 't4', label: 'Pista de montagem abastecida' },
  { key: 't5', label: 'Pista doce abastecida' },
  { key: 't6', label: 'Solicitar lanche da equipe' },
  { key: 't7', label: 'Informar ao atendimento e chef cozinha caso falte algum ingrediente' },
  { key: 't8', label: 'Verificar se todas as lixeiras estão vazias e área de trabalho limpa' },
  { key: 't9', label: 'Verificar se todos estão bem e em condições de trabalho' },
  { key: 't10', label: 'Verificar se todos estão com uniforme OK' },
  { key: 't11', label: 'Verificar se a loja está organizada' },
  { key: 't12', label: 'Passar feedbacks da equipe pro responsável de loja' },
  { key: 't13', label: 'Verificar se todos os itens das bancadas estão com etiquetas' },
  { key: 't14', label: 'Informar pelo WhatsApp no grupo COP o OK do formulário' },
]

const FOTOS = [
  { key: 'bancadas', label: 'Bancadas prontas', emoji: '🍕' },
]

export default function ChecklistPizzaiolo() {
  const [nome, setNome] = useState('')
  const [tarefas, setTarefas] = useState({})
  const [fotos, setFotos] = useState({})
  const [analisando, setAnalisando] = useState({})
  const [resultados, setResultados] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const refs = { bancadas: useRef() }

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

  const handleTarefa = (key) => setTarefas(t => ({ ...t, [key]: !t[key] }))

  const handleFoto = async (key, file) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setFotos(f => ({ ...f, [key]: { file, url, mime: file.type } }))
    setAnalisando(a => ({ ...a, [key]: true }))
    setResultados(r => ({ ...r, [key]: null }))
    try {
      const b64 = await toBase64(file)
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, item: key, imageBase64: b64, mimeType: file.type, tipo: 'pizzaiolo' })
      })
      const data = await res.json()
      if (data.ok) setResultados(r => ({ ...r, [key]: data.resultado }))
    } catch (e) {
      setResultados(r => ({ ...r, [key]: { aprovado: false, status: 'ERRO', observacao: 'Falha na análise' } }))
    }
    setAnalisando(a => ({ ...a, [key]: false }))
  }

  const todasTarefas = TAREFAS.every(t => tarefas[t.key])
  const todasFotos = FOTOS.every(f => resultados[f.key])
  const podeEnviar = nome.trim() && todasTarefas && todasFotos && !enviando

  const handleEnviar = async () => {
    if (!podeEnviar) return
    setEnviando(true)
    try {
      await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, tipo: 'pizzaiolo', turno: 'abertura', tarefas, resultados })
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
    uploadBtn: { width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #d5d3cc', background: '#faf9f6', fontSize: 13, color: '#888780', cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" },
    preview: { width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 180, objectFit: 'cover' },
    submitBtn: { width: '100%', padding: '14px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    submitBtnDis: { width: '100%', padding: '14px', borderRadius: 12, background: '#f3f2ee', color: '#b4b2a9', fontSize: 16, fontWeight: 600, border: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
  }

  if (concluido) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Checklist Pizzaiolo</h1>
      </div>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a18', marginBottom: 8 }}>Checklist enviado!</div>
        <div style={{ fontSize: 14, color: '#888780', marginBottom: 24 }}>Gerente foi notificada. Bom turno!</div>
        <button onClick={() => { setNome(''); setTarefas({}); setFotos({}); setResultados({}); setConcluido(false) }} style={{ ...st.submitBtn, background: '#1a1a18' }}>Novo Checklist</button>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Checklist Pizzaiolo</h1>
        <div style={st.subtitle}>Abertura de turno — 17h15</div>
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
        <div style={st.sectionTitle}>📷 Fotos obrigatórias</div>
        {FOTOS.map(({ key, label, emoji }) => (
          <div key={key} style={st.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
            </div>
            <input ref={refs[key]} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFoto(key, e.target.files[0])} />
            <button style={st.uploadBtn} onClick={() => refs[key].current?.click()}>{fotos[key] ? '📷 Trocar foto' : '📷 Tirar foto'}</button>
            {fotos[key] && <img src={fotos[key].url} alt={label} style={st.preview} />}
            {analisando[key] && <div style={{ fontSize: 13, color: '#888780', marginTop: 8 }}>🔍 Verificando...</div>}
            {resultados[key] && !analisando[key] && <div style={{ fontSize: 13, color: '#3b6d11', marginTop: 8 }}>✅ Foto recebida</div>}
          </div>
        ))}
        <button style={podeEnviar ? st.submitBtn : st.submitBtnDis} onClick={handleEnviar} disabled={!podeEnviar}>
          {enviando ? 'Enviando...' : !nome.trim() ? 'Coloque seu nome' : !todasTarefas ? 'Conclua todas as tarefas' : !todasFotos ? 'Tire a foto das bancadas' : '📤 Enviar Checklist'}
        </button>
      </div>
    </div>
  )
}