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
  const [abaFreelancer, setAbaFreelancer] = useState('lancamentos')
  const [checklists, setChecklists] = useState([])
  const [freelancers, setFreelancers] = useState([])
  const [descontos, setDescontos] = useState([])
  const [loading, setLoading] = useState(false)

  // Novo lançamento
  const [novoNome, setNovoNome] = useState('')
  const [novaFuncao, setNovaFuncao] = useState('')
  const [novoValor, setNovoValor] = useState('')
  const [novaData, setNovaData] = useState(new Date().toISOString().split('T')[0])

  // Novo desconto avulso
  const [descontoNome, setDescontoNome] = useState('')
  const [descontoValor, setDescontoValor] = useState('')
  const [descontoMotivo, setDescontoMotivo] = useState('')
  const [descontoData, setDescontoData] = useState(new Date().toISOString().split('T')[0])

  const handleLogin = () => {
    if (senha === SENHA) { setAutenticado(true); loadData() }
    else setErro('Senha incorreta')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [c, f, d] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/freelancers').then(r => r.json()),
        fetch('/api/descontos').then(r => r.json()),
      ])
      if (c.ok) setChecklists(c.data)
      if (f.ok) setFreelancers(f.data)
      if (d.ok) setDescontos(d.data)
    } catch (e) {}
    setLoading(false)
  }

  const adicionarFreelancer = async () => {
    if (!novoNome || !novaFuncao || !novoValor) return
    await fetch('/api/freelancers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: novoNome, funcao: novaFuncao, valor: novoValor, data: novaData })
    })
    setNovoNome(''); setNovaFuncao(''); setNovoValor('')
    loadData()
  }

  const adicionarDesconto = async () => {
    if (!descontoNome || !descontoValor) return
    await fetch('/api/descontos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: descontoNome, valor: descontoValor, motivo: descontoMotivo, data: descontoData })
    })
    setDescontoNome(''); setDescontoValor(''); setDescontoMotivo('')
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

  const deletarFreelancer = async (id) => {
    await fetch('/api/freelancers', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadData()
  }

  const deletarDesconto = async (id) => {
    await fetch('/api/descontos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadData()
  }

  const formatData = (d) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  // Calcula total líquido por nome
  const totalBruto = (nome) => freelancers.filter(f => f.nome === nome).reduce((acc, f) => acc + parseFloat(f.valor), 0)
  const totalDesconto = (nome) => descontos.filter(d => d.nome === nome).reduce((acc, d) => acc + parseFloat(d.valor), 0)
  const totalLiquido = (nome) => totalBruto(nome) - totalDesconto(nome)

  const totalPendente = [...new Set(freelancers.filter(f => !f.pago).map(f => f.nome))].reduce((acc, nome) => acc + totalLiquido(nome), 0)
  const totalPago = [...new Set(freelancers.filter(f => f.pago).map(f => f.nome))].reduce((acc, nome) => acc + totalLiquido(nome), 0)

  // Nomes únicos dos freelancers
  const nomesFreelancers = [...new Set(freelancers.map(f => f.nome))]

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
    tabSmall: (active) => ({ flex: 1, padding: '8px', borderRadius: 8, border: 'none', background: active ? '#D85A30' : '#f3f2ee', color: active ? '#fff' : '#888780', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }),
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

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <button style={st.tabSmall(abaFreelancer === 'lancamentos')} onClick={() => setAbaFreelancer('lancamentos')}>➕ Lançamento</button>
              <button style={st.tabSmall(abaFreelancer === 'desconto')} onClick={() => setAbaFreelancer('desconto')}>➖ Desconto</button>
              <button style={st.tabSmall(abaFreelancer === 'lista')} onClick={() => setAbaFreelancer('lista')}>📋 Lista</button>
            </div>

            {abaFreelancer === 'lancamentos' && (
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
                <label style={{ ...st.label, marginTop: 10 }}>Data</label>
                <input style={st.input} type="date" value={novaData} onChange={e => setNovaData(e.target.value)} />
                <button style={st.btnOrange} onClick={adicionarFreelancer}>➕ Adicionar lançamento</button>
              </div>
            )}

            {abaFreelancer === 'desconto' && (
              <div style={st.card}>
                <label style={st.label}>Nome do freelancer</label>
                {nomesFreelancers.length > 0 ? (
                  <select style={st.select} value={descontoNome} onChange={e => setDescontoNome(e.target.value)}>
                    <option value="">Selecione</option>
                    {nomesFreelancers.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input style={st.input} placeholder="Nome do freelancer" value={descontoNome} onChange={e => setDescontoNome(e.target.value)} />
                )}
                <label style={{ ...st.label, marginTop: 10 }}>Valor do desconto (R$)</label>
                <input style={st.input} type="number" placeholder="0,00" value={descontoValor} onChange={e => setDescontoValor(e.target.value)} />
                <label style={{ ...st.label, marginTop: 10 }}>Motivo</label>
                <input style={st.input} placeholder="Ex: Vale, consumo, adiantamento..." value={descontoMotivo} onChange={e => setDescontoMotivo(e.target.value)} />
                <label style={{ ...st.label, marginTop: 10 }}>Data</label>
                <input style={st.input} type="date" value={descontoData} onChange={e => setDescontoData(e.target.value)} />
                <button style={st.btnOrange} onClick={adicionarDesconto}>➖ Lançar desconto</button>
              </div>
            )}

            {abaFreelancer === 'lista' && (
              <>
                <button style={st.btn} onClick={loadData}>🔄 Atualizar</button>
                {nomesFreelancers.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum lançamento ainda.</div>}
                {nomesFreelancers.map(nome => {
                  const lancs = freelancers.filter(f => f.nome === nome)
                  const descs = descontos.filter(d => d.nome === nome)
                  const bruto = totalBruto(nome)
                  const desc = totalDesconto(nome)
                  const liq = totalLiquido(nome)
                  const pago = lancs.every(f => f.pago)
                  return (
                    <div key={nome} style={st.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 600 }}>{nome}</div>
                        <button onClick={() => togglePago(lancs[0]?.id, pago)} style={{ ...st.btnSmall, background: pago ? '#eaf3de' : '#fcebeb', color: pago ? '#3b6d11' : '#a32d2d' }}>
                          {pago ? '✅ Pago' : '⏳ Pendente'}
                        </button>
                      </div>
                      {lancs.map(f => (
                        <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780', padding: '4px 0' }}>
                          <span>{new Date(f.data).toLocaleDateString('pt-BR')} — {f.funcao}</span>
                          <span>R$ {parseFloat(f.valor).toFixed(2)}</span>
                        </div>
                      ))}
                      {descs.map(d => (
                        <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a32d2d', padding: '4px 0' }}>
                          <span>➖ {d.motivo || 'Desconto'} ({new Date(d.data).toLocaleDateString('pt-BR')})</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span>-R$ {parseFloat(d.valor).toFixed(2)}</span>
                            <button onClick={() => deletarDesconto(d.id)} style={{ ...st.btnSmall, background: 'none', color: '#a32d2d', padding: '2px 6px' }}>🗑️</button>
                          </div>
                        </div>
                      ))}
                      <div style={{ borderTop: '1px solid #f0efe9', marginTop: 8, paddingTop: 8 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780' }}>
                          <span>Bruto</span><span>R$ {bruto.toFixed(2)}</span>
                        </div>
                        {desc > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a32d2d' }}>
                            <span>Descontos</span><span>-R$ {desc.toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#1a1a18', marginTop: 4 }}>
                          <span>Líquido</span><span>R$ {liq.toFixed(2)}</span>
                        </div>
                      </div>
                      <button onClick={() => deletarFreelancer(lancs[0]?.id)} style={{ ...st.btnSmall, background: '#f3f2ee', color: '#888780', marginTop: 8, border: '1px solid #e5e5e0' }}>🗑️ Remover último lançamento</button>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}