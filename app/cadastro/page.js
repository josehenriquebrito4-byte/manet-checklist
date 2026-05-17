'use client'
import { useState, useRef } from 'react'

const FUNCOES = [
  { val: 'garcom', label: 'Garçom 🍽️' },
  { val: 'pizzaiolo', label: 'Pizzaiolo 🍕' },
  { val: 'caixa', label: 'Caixa 💴' },
  { val: 'atendente', label: 'Atendente 📲' },
  { val: 'despacho', label: 'Despacho 🛵' },
  { val: 'motoboy', label: 'Motoboy 🏍️' }
]

export default function CadastroFuncionario() {
  const [form, setForm] = useState({
    nome: '',
    funcao: '',
    cpf: '',
    endereco: '',
    chave_pix: '',
    telefone: '',
    foto_base64: ''
  })
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)
  const [erro, setErro] = useState('')

  const fileInputRef = useRef(null)

  const resizeImage = (file) => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let w = img.width
        let h = img.height
        const MAX = 600
        if (w > h && w > MAX) { h *= MAX / w; w = MAX }
        else if (h > MAX) { w *= MAX / h; h = MAX }
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })

  const handleFoto = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const base64 = await resizeImage(file)
    setForm(f => ({ ...f, foto_base64: base64 }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nome || !form.funcao || !form.cpf || !form.telefone || !form.foto_base64) {
      setErro('Preencha os campos obrigatórios e tire uma selfie.')
      return
    }
    setErro('')
    setLoading(true)

    try {
      const res = await fetch('/api/funcionarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (data.ok) {
        setSucesso(true)
      } else {
        setErro('Erro ao salvar. Tente novamente.')
      }
    } catch(err) {
      setErro('Erro de conexão.')
    }
    setLoading(false)
  }

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: '#f8f7f4', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '24px 20px 30px', color: '#fff', borderRadius: '0 0 20px 20px' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 24, fontWeight: 700, margin: 0, lineHeight: 1.2 },
    body: { padding: '20px', marginTop: -15 },
    card: { background: '#fff', padding: '24px 20px', borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#1a1a18', marginBottom: 6 },
    input: { width: '100%', padding: '14px', fontSize: 15, borderRadius: 10, border: '1px solid #e5e5e0', background: '#fcfcfc', fontFamily: "inherit", boxSizing: 'border-box', marginBottom: 16, transition: 'border-color 0.2s' },
    select: { width: '100%', padding: '14px', fontSize: 15, borderRadius: 10, border: '1px solid #e5e5e0', background: '#fcfcfc', fontFamily: "inherit", boxSizing: 'border-box', marginBottom: 16 },
    btn: { width: '100%', padding: '16px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "inherit", marginTop: 8 },
    btnFoto: { width: '100%', padding: '14px', borderRadius: 10, border: '1px dashed #D85A30', background: '#fff5f2', color: '#D85A30', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "inherit", marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 },
    imgPreview: { width: 100, height: 100, borderRadius: 50, objectFit: 'cover', margin: '0 auto 16px', display: 'block', border: '3px solid #D85A30' },
    msg: { textAlign: 'center', padding: '40px 20px' },
    msgIcon: { fontSize: 48, marginBottom: 16 },
    msgTitle: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
    msgDesc: { fontSize: 15, color: '#888780' }
  }

  if (sucesso) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Cadastro concluído</h1>
      </div>
      <div style={st.body}>
        <div style={{...st.card, ...st.msg}}>
          <div style={st.msgIcon}>🎉</div>
          <div style={st.msgTitle}>Tudo certo, {form.nome.split(' ')[0]}!</div>
          <div style={st.msgDesc}>Seu cadastro foi salvo com sucesso no nosso sistema. Obrigado!</div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Cadastro da Equipe</h1>
      </div>
      <div style={st.body}>
        <form style={st.card} onSubmit={handleSubmit}>
          
          <label style={st.label}>Função *</label>
          <select style={st.select} value={form.funcao} onChange={e => setForm({...form, funcao: e.target.value})}>
            <option value="">Selecione sua função...</option>
            {FUNCOES.map(f => <option key={f.val} value={f.val}>{f.label}</option>)}
          </select>

          <label style={st.label}>Nome Completo *</label>
          <input style={st.input} placeholder="Digite seu nome" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />

          <label style={st.label}>CPF *</label>
          <input style={st.input} placeholder="000.000.000-00" value={form.cpf} onChange={e => setForm({...form, cpf: e.target.value})} />

          <label style={st.label}>Telefone / WhatsApp *</label>
          <input style={st.input} type="tel" placeholder="(21) 99999-9999" value={form.telefone} onChange={e => setForm({...form, telefone: e.target.value})} />

          <label style={st.label}>Chave PIX</label>
          <input style={st.input} placeholder="E-mail, CPF ou Telefone" value={form.chave_pix} onChange={e => setForm({...form, chave_pix: e.target.value})} />

          <label style={st.label}>Endereço Completo</label>
          <input style={st.input} placeholder="Rua, número, bairro..." value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />

          <label style={st.label}>Sua foto (Selfie) *</label>
          {form.foto_base64 && <img src={form.foto_base64} style={st.imgPreview} />}
          <button type="button" style={st.btnFoto} onClick={() => fileInputRef.current.click()}>
            {form.foto_base64 ? '📷 Trocar Foto' : '📷 Tirar Selfie'}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" capture="user" style={{display:'none'}} onChange={handleFoto} />

          {erro && <div style={{ color: '#a32d2d', fontSize: 14, marginBottom: 16, textAlign: 'center', fontWeight: 500 }}>{erro}</div>}

          <button type="submit" style={st.btn} disabled={loading}>
            {loading ? 'Salvando...' : 'Finalizar Cadastro'}
          </button>
        </form>
      </div>
    </div>
  )
}
