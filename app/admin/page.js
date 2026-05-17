'use client'
import { useState, useEffect } from 'react'

const REFERENCIAS = [
  { key: 'salao', label: 'Salão arrumado', emoji: '🪑' },
  { key: 'banheiro_m', label: 'Banheiro masculino limpo', emoji: '🚹' },
  { key: 'banheiro_f', label: 'Banheiro feminino limpo', emoji: '🚺' },
  { key: 'frente', label: 'Frente de loja arrumada', emoji: '🏪' },
  { key: 'bancadas', label: 'Bancadas prontas', emoji: '🍕' },
]

export default function Admin() {
  const [senha, setSenha] = useState('')
  const [autenticado, setAutenticado] = useState(false)
  const [uploading, setUploading] = useState({})
  const [salvo, setSalvo] = useState({})
  const [erro, setErro] = useState('')

  useEffect(() => {
    if (autenticado) {
      fetch('/api/reference').then(r => r.json()).then(data => {
        if (data.ok && data.keys) {
          const s = {}
          data.keys.forEach(k => s[k] = true)
          setSalvo(s)
        }
      })
    }
  }, [autenticado])

  const handleLogin = () => {
    if (senha === 'manet2024') setAutenticado(true)
    else setErro('Senha incorreta')
  }

  const handleUpload = async (key, file) => {
    if (!file) return
    setUploading(u => ({ ...u, [key]: true }))
    setSalvo(s => ({ ...s, [key]: false }))

    const toBase64 = (f) => new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = e => res(e.target.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(f)
    })

    try {
      const b64 = await toBase64(file)
      const res = await fetch('/api/reference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, imageBase64: b64, mimeType: file.type })
      })
      const data = await res.json()
      if (data.ok) setSalvo(s => ({ ...s, [key]: true }))
    } catch (e) {
      setErro('Erro ao salvar foto')
    }
    setUploading(u => ({ ...u, [key]: false }))
  }

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    body: { padding: '20px 16px' },
    label: { fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', borderRadius: 12, background: '#1a1a18', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '14px 16px', marginBottom: 12 },
    uploadBtn: { width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed #d5d3cc', background: '#faf9f6', fontSize: 13, color: '#888780', cursor: 'pointer', textAlign: 'center', fontFamily: "'DM Sans', system-ui, sans-serif" },
  }

  if (!autenticado) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Admin — Fotos de Referência</h1>
      </div>
      <div style={st.body}>
        <label style={st.label}>Senha</label>
        <input style={st.input} type="password" placeholder="Digite a senha" value={senha} onChange={e => setSenha(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        {erro && <div style={{ color: '#a32d2d', fontSize: 13, marginTop: 8 }}>{erro}</div>}
        <button style={st.btn} onClick={handleLogin}>Entrar</button>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Admin — Fotos de Referência</h1>
      </div>
      <div style={st.body}>
        <p style={{ fontSize: 14, color: '#888780', marginBottom: 20 }}>Cadastre aqui as fotos padrão de cada ambiente. A IA vai comparar as fotos dos funcionários com essas referências.</p>
        {REFERENCIAS.map(({ key, label, emoji }) => (
          <div key={key} style={st.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 22 }}>{emoji}</span>
              <span style={{ fontSize: 15, fontWeight: 500 }}>{label}</span>
            </div>
            <input type="file" accept="image/*" id={`ref-${key}`} style={{ display: 'none' }} onChange={e => handleUpload(key, e.target.files[0])} />
            <label htmlFor={`ref-${key}`} style={st.uploadBtn}>
              {uploading[key] ? '⏳ Salvando...' : salvo[key] ? '✅ Foto salva!' : '📷 Enviar foto de referência'}
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}