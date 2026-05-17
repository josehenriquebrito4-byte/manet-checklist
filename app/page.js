'use client'
import { useState, useRef } from 'react'

const ITENS = [
  { key: 'gas', label: 'Registro de Gás', emoji: '🔴', desc: 'Foto do registro — deve estar fechado' },
  { key: 'freezer', label: 'Freezer', emoji: '❄️', desc: 'Foto do freezer aberto — deve estar organizado' },
  { key: 'bancada', label: 'Bancada', emoji: '🍕', desc: 'Foto da bancada — deve estar montada e limpa' },
]

export default function Checklist() {
  const [funcionario, setFuncionario] = useState('')
  const [fotos, setFotos] = useState({})
  const [analisando, setAnalisando] = useState({})
  const [resultados, setResultados] = useState({})
  const [enviando, setEnviando] = useState(false)
  const [concluido, setConcluido] = useState(false)
  const refs = { gas: useRef(), freezer: useRef(), bancada: useRef() }

  const toBase64 = (file) => new Promise((res, rej) => {
    const r = new FileReader()
    r.onload = e => res(e.target.result.split(',')[1])
    r.onerror = rej
    r.readAsDataURL(file)
  })

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
        body: JSON.stringify({ funcionario: funcionario || 'Funcionário', item: key, imageBase64: b64, mimeType: file.type })
      })
      const data = await res.json()
      if (data.ok) setResultados(r => ({ ...r, [key]: data.resultado }))
    } catch (e) {
      setResultados(r => ({ ...r, [key]: { aprovado: false, status: 'ERRO', observacao: 'Falha na análise' } }))
    }
    setAnalisando(a => ({ ...a, [key]: false }))
  }

  const podeEnviar = funcionario.trim() && ITENS.every(i => resultados[i.key])
  const todosOk = ITENS.every(i => resultados[i.key]?.aprovado)

  const handleEnviar = async () => {
    if (!podeEnviar) return
    setEnviando(true)
    try {
      await fetch('/api/checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funcionario, resultados })
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
    body: { padding: '20px 16px' },
    label: { fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '14px 16px', marginBottom: 12 },
    uploadBtn: { width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #d5d3cc', background: '#faf9f6', fontSize: 13, color: '#888780', cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" },
    preview: { width: '100%', borderRadius: 8, marginTop: 8, maxHeight: 180, objectFit: 'cover' },
    submitBtn: { width: '100%', padding: '14px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    submitBtnDis: { width: '100%', padding: '14px', borderRadius: 12, background: '#f3f2ee', color: '#b4b2a9', fontSize: 16, fontWeight: 600, border: 'none', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
  }

  if (concluido) return (
    <div style={st.wrap}>
      <div style={st.header}><div style={st.logo}>#VEM PRA MANET</div><h1 style={st.title}>Checklist</h1></div>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>{todosOk ? '✅' : '⚠️'}</div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#1a1a18', marginBottom: 8 }}>{todosOk ? 'Tudo certo!' : 'Pendências identificadas'}</div>
        <div style={{ fontSize: 14, color: '#888780', marginBottom: 24 }}>{todosOk ? 'Checklist enviado para o gestor.' : 'Gestor foi notificado sobre as pendências.'}</div>
        <button onClick={() => { setFuncionario(''); setFotos({}); setResultados({}); setConcluido(false) }} style={{ ...st.submitBtn, background: '#1a1a18' }}>Novo Checklist</button>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Checklist de Abertura</h1>
      </div>
      <div style={st.body}>
        <div style={{ marginBottom: 20 }}>
          <label style={st.label}>Seu nome</label>
          <input style={st.input} placeholder="Ex: João Silva" value={funcionario} onChange={e => setFuncionario(e.target.value)} />
        </div>
        {ITENS.map(({ key, label, emoji, desc }) => (
          <div key={key} style={st.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: '#1a1a18' }}>{label}</span>
            </div>
            <div style={{ fontSize: 12, color: '#b4b2a9', marginBottom: 10 }}>{desc}</div>
            <input ref={refs[key]} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleFoto(key, e.target.files[0])} />
            <button style={st.uploadBtn} onClick={() => refs[key].current?.click()}>{fotos[key] ? '📷 Trocar foto' : '📷 Tirar foto'}</button>
            {fotos[key] && <img src={fotos[key].url} alt={label} style={st.preview} />}
            {analisando[key] && <div style={{ fontSize: 13, color: '#888780', marginTop: 8 }}>🔍 Analisando com IA...</div>}
            {resultados[key] && !analisando[key] && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500, background: resultados[key].aprovado ? '#eaf3de' : '#fcebeb', color: resultados[key].aprovado ? '#3b6d11' : '#a32d2d', marginTop: 8 }}>
                {resultados[key].aprovado ? '✅' : '❌'} {resultados[key].status} — {resultados[key].observacao}
              </div>
            )}
          </div>
        ))}
        <button style={podeEnviar ? st.submitBtn : st.submitBtnDis} onClick={handleEnviar} disabled={!podeEnviar || enviando}>
          {enviando ? 'Enviando...' : podeEnviar ? '📤 Enviar Checklist' : 'Tire as 3 fotos para enviar'}
        </button>
      </div>
    </div>
  )
}