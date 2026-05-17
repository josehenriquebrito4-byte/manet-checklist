'use client'
import { useState, useEffect } from 'react'

const SENHA = 'manet2024'

const tipoLabel = {
  garcom: 'Garçom 🍽️', pizzaiolo: 'Pizzaiolo 🍕', caixa: 'Caixa 💴',
  atendente: 'Atendente 📲', despacho: 'Despacho 🛵', compras: 'Compras 🛒',
}

const funcoes = ['Atendente', 'Cozinha', 'Motoboy', 'Garçom', 'Pizzaiolo', 'Caixa', 'Despacho']

export default function Gerente() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState('dashboard')
  const [checklists, setChecklists] = useState([])
  const [freelancers, setFreelancers] = useState([])
  const [loading, setLoading] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novaFuncao, setNovaFuncao] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novoDesconto, setNovoDesconto] = useState('')
  const [novoMotivoDesconto, setNovoMotivoDesconto] = useState('')
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0])
  const [editandoDesconto, setEditandoDesconto] = useState(null)
  const [descontoEdit, setDescontoEdit] = useState('')
  const [motivoEdit, setMotivoEdit] = useState('')

  const handleLogin = () => {
    if (senha === SENHA) { setAutenticado(true); loadData() }
    else setErro('Senha incorreta')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [c, f] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/freelancers').then(r => r.json())
      ])
      if (c.ok) setChecklists(c.data)
      if (f.ok) setFreelancers(f.data)
    } catch (e) {}
    setLoading(false)
  }

  const adicionarFreelancer = async () => {
    if (!novoNome || !novaFuncao || !novoValor) return
    await fetch('/api/freelancers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, funcao: novaFuncao, valor: novoValor, data: novaData, desconto: novoDesconto || 0, motivo_desconto: novoMotivoDesconto })
    })
    setNovoNome(''); setNovaFuncao(''); setNovoValor(''); setNovoDesconto(''); setNovoMotivoDesconto('')
    loadData()
  }

  const togglePago = async (id, pago) => {
    await fetch('/api/freelancers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pago: !pago })
    })
    loadData()
  }

  const salvarDesconto = async (id) => {
    await fetch('/api/freelancers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, desconto: descontoEdit, motivo_desconto: motivoEdit })
    })
    setEditandoDesconto(null)
    loadData()
  }

  const deletarFreelancer = async (id) => {
    await fetch('/api/freelancers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadData()
  }

  const formatData = (d) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  const liquido = (f) => parseFloat(f.valor) - parseFloat(f.desconto || 0)
  const totalPendente = freelancers.filter(f => !f.pago).reduce((acc, f) => acc + liquido(f), 0)
  const totalPago = freelancers.filter(f => f.pago).reduce((acc, f) => acc + liquido(f), 0)

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    body: { padding: '20px 16px' },
    label: { fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    select: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    btn: { width: '100%', padding: '14px', borderRadius: 12, background: '#1a1a18', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    btnOrange: { width: '100%', padding: '14px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 16, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 8 },
    btnSmall: { padding: '6px 12px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' },
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '14px 16px', marginBottom: 10 },
    tabs: { display: 'flex', gap: 8, marginBottom: 20 },
    tab: (active) => ({ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: active ? '#1a1a18' : '#f3f2ee', color: active ? '#fff' : '#888780', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }),
    badge: (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ok ? '#eaf3de' : '#fcebeb', color: ok ? '#3b6d11' : '#a32d2d' }),
    sectionTitle: { fontSize: 13, fontWeight: 600, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10, marginTop: 20 },
  }

  if (!autenticado) return (
    <div style={st.wrap}>
      <div style={st.header}>
        <div style={st.logo}>#VEM PRA MANET</div>
        <h1 style={st.title}>Portal do Gerente</h1>
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
        <h1 style={st.title}>Portal do Gerente</h1>
      </div>
      <div style={st.body}>
        <div style={st.tabs}>
          <button style={st.tab(aba === 'dashboard')} onClick={() => setAba('dashboard')}>📋 Checklists</button>
          <button style={st.tab(aba === 'freelancers')} onClick={() => setAba('freelancers')}>👥 Freelancers</button>
        </div>

        {aba === 'dashboard' && (
          <>
            <button style={st.btn} onClick={loadData}>🔄 Atualizar</button>
            {loading && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Carregando...</div>}
            {checklists.length === 0 && !loading && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum checklist ainda.</div>}
            {checklists.map(c => (
              <div key={c.id} style={st.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{tipoLabel[c.tipo] || c.tipo}</span>
                  <span style={{ fontSize: 12, color: '#888780' }}>{formatData(c.criado_em)}</span>
                </div>
                <div style={{ fontSize: 14, color: '#1a1a18', marginBottom: 6 }}>👤 {c.nome}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={st.badge(c.tarefas_ok)}>{c.tarefas_ok ? '✅ Tarefas OK' : '❌ Tarefas'}</span>
                  <span style={st.badge(c.fotos_ok)}>{c.fotos_ok ? '✅ Fotos OK' : '❌ Fotos'}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {aba === 'freelancers' && (
          <>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, background: '#fcebeb', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#a32d2d', fontWeight: 600 }}>PENDENTE</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#a32d2d' }}>R$ {totalPendente.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: '#eaf3de', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: '#3b6d11', fontWeight: 600 }}>PAGO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#3b6d11' }}>R$ {totalPago.toFixed(2)}</div>
              </div>
            </div>

            <div style={st.sectionTitle}>➕ Adicionar</div>
            <div style={st.card}>
              <label style={st.label}>Nome</label>
              <input style={st.input} placeholder="Nome do freelancer" value={novoNome} onChange={e => setNovoNome(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Função</label>
              <select style={st.select} value={novaFuncao} onChange={e => setNovaFuncao(e.target.value)}>
                <option value="">Selecione</option>
                {funcoes.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
              <label style={{ ...st.label, marginTop: 10 }}>Valor (R$)</label>
              <input style={st.input} type="number" placeholder="0,00" value={novoValor} onChange={e => setNovoValor(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Desconto (R$)</label>
              <input style={st.input} type="number" placeholder="0,00" value={novoDesconto} onChange={e => setNovoDesconto(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Motivo do desconto</label>
              <input style={st.input} placeholder="Ex: Vale, consumo..." value={novoMotivoDesconto} onChange={e => setNovoMotivoDesconto(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Data</label>
              <input style={st.input} type="date" value={novaData} onChange={e => setNovaData(e.target.value)} />
              <button style={st.btnOrange} onClick={adicionarFreelancer}>➕ Adicionar</button>
            </div>

            <div style={st.sectionTitle}>📋 Lançamentos</div>
            {freelancers.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum lançamento ainda.</div>}
            {freelancers.map(f => (
              <div key={f.id} style={st.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{f.nome}</div>
                    <div style={{ fontSize: 12, color: '#888780' }}>{f.funcao} • {new Date(f.data).toLocaleDateString('pt-BR')}</div>
                    <div style={{ fontSize: 13, color: '#1a1a18', marginTop: 4 }}>Bruto: R$ {parseFloat(f.valor).toFixed(2)}</div>
                    {parseFloat(f.desconto) > 0 && (
                      <div style={{ fontSize: 13, color: '#a32d2d' }}>Desconto: -R$ {parseFloat(f.desconto).toFixed(2)} {f.motivo_desconto ? `(${f.motivo_desconto})` : ''}</div>
                    )}
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a18', marginTop: 2 }}>Líquido: R$ {liquido(f).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <button onClick={() => togglePago(f.id, f.pago)} style={{ ...st.btnSmall, background: f.pago ? '#eaf3de' : '#fcebeb', color: f.pago ? '#3b6d11' : '#a32d2d' }}>
                      {f.pago ? '✅ Pago' : '⏳ Pendente'}
                    </button>
                    <button onClick={() => { setEditandoDesconto(f.id); setDescontoEdit(f.desconto || ''); setMotivoEdit(f.motivo_desconto || '') }} style={{ ...st.btnSmall, background: '#f3f2ee', color: '#888780' }}>
                      ✏️ Desconto
                    </button>
                    <button onClick={() => deletarFreelancer(f.id)} style={{ ...st.btnSmall, background: '#fff', color: '#888780', border: '1px solid #e5e5e0' }}>
                      🗑️
                    </button>
                  </div>
                </div>
                {editandoDesconto === f.id && (
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0efe9' }}>
                    <label style={st.label}>Valor do desconto</label>
                    <input style={st.input} type="number" placeholder="0,00" value={descontoEdit} onChange={e => setDescontoEdit(e.target.value)} />
                    <label style={{ ...st.label, marginTop: 8 }}>Motivo</label>
                    <input style={st.input} placeholder="Ex: Vale, consumo..." value={motivoEdit} onChange={e => setMotivoEdit(e.target.value)} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => salvarDesconto(f.id)} style={{ ...st.btnSmall, background: '#D85A30', color: '#fff', flex: 1, padding: '10px' }}>Salvar</button>
                      <button onClick={() => setEditandoDesconto(null)} style={{ ...st.btnSmall, background: '#f3f2ee', color: '#888780', flex: 1, padding: '10px' }}>Cancelar</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}