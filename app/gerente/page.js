'use client'
import { useState, useEffect } from 'react'

const SENHA = 'manet2024'

const tipoLabel = {
  garcom: 'Garçom 🍽️', pizzaiolo: 'Pizzaiolo 🍕', caixa: 'Caixa 💴',
  atendente: 'Atendente 📲', despacho: 'Despacho 🛵', compras: 'Compras 🛒',
}

function getSemana(offset = 0) {
  const hoje = new Date()
  const dia = hoje.getDay()
  let diff = (dia - 3 + 7) % 7
  const inicio = new Date(hoje)
  inicio.setDate(hoje.getDate() - diff - offset * 7)
  inicio.setHours(0,0,0,0)
  const fim = new Date(inicio)
  fim.setDate(inicio.getDate() + 6)
  fim.setHours(23,59,59,999)
  return { inicio, fim }
}

export default function Gerente() {
  const [autenticado, setAutenticado] = useState(false)
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [aba, setAba] = useState('checklists')
  const [subAba, setSubAba] = useState('lancamento')
  const [checklists, setChecklists] = useState([])
  const [motoboys, setMotoboys] = useState([])
  const [descontos, setDescontos] = useState([])
  const [cadastros, setCadastros] = useState([])
  const [loading, setLoading] = useState(false)
  const [semanaOffset, setSemanaOffset] = useState(0)

  // Lançamento dia
  const [lNome, setLNome] = useState('')
  const [lValor, setLValor] = useState('')
  const [lData, setLData] = useState(new Date().toISOString().split('T')[0])

  // Vale/desconto
  const [dNome, setDNome] = useState('')
  const [dValor, setDValor] = useState('')
  const [dDesc, setDDesc] = useState('')
  const [dData, setDData] = useState(new Date().toISOString().split('T')[0])

  // Cadastro
  const [cNome, setCNome] = useState('')
  const [cTel, setCTel] = useState('')
  const [cPix, setCPix] = useState('')

  const handleLogin = () => {
    if (senha === SENHA) { setAutenticado(true); loadData() }
    else setErro('Senha incorreta')
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const [c, m, d, ca] = await Promise.all([
        fetch('/api/dashboard').then(r => r.json()),
        fetch('/api/motoboys').then(r => r.json()),
        fetch('/api/descontos').then(r => r.json()),
        fetch('/api/cadastro-motoboys').then(r => r.json()),
      ])
      if (c.ok) setChecklists(c.data)
      if (m.ok) setMotoboys(m.data)
      if (d.ok) setDescontos(d.data)
      if (ca.ok) setCadastros(ca.data)
    } catch(e) {}
    setLoading(false)
  }

  const lancarDia = async () => {
    if (!lNome || !lValor) return
    await fetch('/api/motoboys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: lNome, valor: lValor, data: lData })
    })
    setLNome(''); setLValor('')
    loadData()
  }

  const lancarDesconto = async () => {
    if (!dNome || !dValor) return
    await fetch('/api/descontos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: dNome, valor: dValor, motivo: dDesc, data: dData })
    })
    setDNome(''); setDValor(''); setDDesc('')
    loadData()
  }

  const salvarCadastro = async () => {
    if (!cNome) return
    await fetch('/api/cadastro-motoboys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: cNome, telefone: cTel, chave_pix: cPix })
    })
    setCNome(''); setCTel(''); setCPix('')
    loadData()
  }

  const deletarCadastro = async (id) => {
    await fetch('/api/cadastro-motoboys', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    loadData()
  }

  const marcarPago = async (nome) => {
    await fetch('/api/motoboys', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, pago: true })
    })
    loadData()
  }

  const deletarLancamento = async (id) => {
    await fetch('/api/motoboys', {
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

  const { inicio, fim } = getSemana(semanaOffset)

  const filtrarSemana = (items, offset = semanaOffset) => {
    const { inicio, fim } = getSemana(offset)
    return items.filter(i => {
      const d = new Date(i.data); d.setHours(12)
      return d >= inicio && d <= fim
    })
  }

  const motoboysSemana = filtrarSemana(motoboys)
  const descontosSemana = filtrarSemana(descontos)
  const nomes = [...new Set(motoboysSemana.map(m => m.nome))]

  const bruto = (nome) => motoboysSemana.filter(m => m.nome === nome).reduce((a, m) => a + parseFloat(m.valor), 0)
  const desc = (nome) => descontosSemana.filter(d => d.nome === nome).reduce((a, d) => a + parseFloat(d.valor), 0)
  const liquido = (nome) => bruto(nome) - desc(nome)
  const pago = (nome) => motoboysSemana.filter(m => m.nome === nome).every(m => m.pago)

  const totalPendente = nomes.filter(n => !pago(n)).reduce((a, n) => a + liquido(n), 0)
  const totalPago = nomes.filter(n => pago(n)).reduce((a, n) => a + liquido(n), 0)

  const nomesExistentes = cadastros.map(c => c.nome)
  const getCadastro = (nome) => cadastros.find(c => c.nome === nome)

  const formatData = (d) => new Date(d).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })

  // Gera lista de semanas anteriores
  const semanasAnteriores = []
  for (let i = 1; i <= 8; i++) {
    const { inicio, fim } = getSemana(i)
    const temDados = motoboys.some(m => {
      const d = new Date(m.data); d.setHours(12)
      return d >= inicio && d <= fim
    })
    if (temDados) semanasAnteriores.push(i)
  }

  const st = {
    wrap: { maxWidth: 480, margin: '0 auto', padding: '0 0 40px', fontFamily: "'DM Sans', system-ui, sans-serif" },
    header: { background: '#1a1a18', padding: '20px 20px 24px', color: '#fff' },
    logo: { fontSize: 13, fontWeight: 500, opacity: 0.85, marginBottom: 4 },
    title: { fontSize: 22, fontWeight: 600, margin: 0 },
    subtitle: { fontSize: 13, opacity: 0.8, marginTop: 4 },
    body: { padding: '20px 16px' },
    label: { fontSize: 13, fontWeight: 500, color: '#888780', marginBottom: 6, display: 'block' },
    input: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box', marginBottom: 2 },
    select: { width: '100%', padding: '12px 14px', fontSize: 15, borderRadius: 10, border: '0.5px solid #d5d3cc', background: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", boxSizing: 'border-box' },
    btn: { width: '100%', padding: '13px', borderRadius: 12, background: '#1a1a18', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 10 },
    btnOrange: { width: '100%', padding: '13px', borderRadius: 12, background: '#D85A30', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif", marginTop: 10 },
    btnSmall: (bg, color) => ({ padding: '5px 11px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: bg, color }),
    card: { background: '#fff', borderRadius: 12, border: '0.5px solid #e5e5e0', padding: '14px 16px', marginBottom: 10 },
    tabs: { display: 'flex', gap: 6, marginBottom: 16 },
    tab: (a) => ({ flex: 1, padding: '10px 4px', borderRadius: 8, border: 'none', background: a ? '#1a1a18' : '#f3f2ee', color: a ? '#fff' : '#888780', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }),
    subTab: (a) => ({ flex: 1, padding: '8px 4px', borderRadius: 8, border: 'none', background: a ? '#D85A30' : '#f3f2ee', color: a ? '#fff' : '#888780', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', system-ui, sans-serif" }),
    badge: (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: ok ? '#eaf3de' : '#fcebeb', color: ok ? '#3b6d11' : '#a32d2d' }),
    sectionTitle: { fontSize: 11, fontWeight: 700, color: '#888780', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, marginTop: 12 },
    pixBox: { background: '#f8f7f4', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontSize: 12 },
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
        <div style={st.subtitle}>
          {semanaOffset === 0 ? 'Semana atual' : `${semanaOffset} semana(s) atrás`}: {inicio.toLocaleDateString('pt-BR')} — {fim.toLocaleDateString('pt-BR')}
        </div>
      </div>
      <div style={st.body}>
        <div style={st.tabs}>
          <button style={st.tab(aba === 'checklists')} onClick={() => setAba('checklists')}>📋 Checks</button>
          <button style={st.tab(aba === 'motoboys')} onClick={() => setAba('motoboys')}>🛵 Motoboys</button>
          <button style={st.tab(aba === 'cadastro')} onClick={() => setAba('cadastro')}>👤 Cadastro</button>
          <button style={st.tab(aba === 'historico')} onClick={() => setAba('historico')}>📅 Histórico</button>
        </div>

        {aba === 'checklists' && (
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
                <div style={{ fontSize: 14, marginBottom: 6 }}>👤 {c.nome}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={st.badge(c.tarefas_ok)}>{c.tarefas_ok ? '✅ Tarefas' : '❌ Tarefas'}</span>
                  <span style={st.badge(c.fotos_ok)}>{c.fotos_ok ? '✅ Fotos' : '❌ Fotos'}</span>
                </div>
              </div>
            ))}
          </>
        )}

        {aba === 'motoboys' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, background: '#fcebeb', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#a32d2d', fontWeight: 700 }}>A PAGAR</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#a32d2d' }}>R$ {totalPendente.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: '#eaf3de', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: '#3b6d11', fontWeight: 700 }}>PAGO</div>
                <div style={{ fontSize: 17, fontWeight: 700, color: '#3b6d11' }}>R$ {totalPago.toFixed(2)}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button style={st.subTab(subAba === 'lancamento')} onClick={() => setSubAba('lancamento')}>➕ Dia</button>
              <button style={st.subTab(subAba === 'vale')} onClick={() => setSubAba('vale')}>➖ Vale</button>
              <button style={st.subTab(subAba === 'resumo')} onClick={() => setSubAba('resumo')}>📊 Resumo</button>
            </div>

            {subAba === 'lancamento' && (
              <div style={st.card}>
                <label style={st.label}>Nome do motoboy</label>
                {nomesExistentes.length > 0 ? (
                  <select style={st.select} value={lNome} onChange={e => setLNome(e.target.value)}>
                    <option value="">Selecione</option>
                    {nomesExistentes.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input style={st.input} placeholder="Nome" value={lNome} onChange={e => setLNome(e.target.value)} />
                )}
                <label style={{ ...st.label, marginTop: 10 }}>Valor do dia (R$)</label>
                <input style={st.input} type="number" placeholder="0,00" value={lValor} onChange={e => setLValor(e.target.value)} />
                <label style={{ ...st.label, marginTop: 10 }}>Data</label>
                <input style={st.input} type="date" value={lData} onChange={e => setLData(e.target.value)} />
                <button style={st.btnOrange} onClick={lancarDia}>➕ Lançar dia trabalhado</button>
              </div>
            )}

            {subAba === 'vale' && (
              <div style={st.card}>
                <label style={st.label}>Nome do motoboy</label>
                {nomesExistentes.length > 0 ? (
                  <select style={st.select} value={dNome} onChange={e => setDNome(e.target.value)}>
                    <option value="">Selecione</option>
                    {nomesExistentes.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                ) : (
                  <input style={st.input} placeholder="Nome" value={dNome} onChange={e => setDNome(e.target.value)} />
                )}
                <label style={{ ...st.label, marginTop: 10 }}>Valor (R$)</label>
                <input style={st.input} type="number" placeholder="0,00" value={dValor} onChange={e => setDValor(e.target.value)} />
                <label style={{ ...st.label, marginTop: 10 }}>Descrição</label>
                <input style={st.input} placeholder="Ex: Vale, consumo, adiantamento..." value={dDesc} onChange={e => setDDesc(e.target.value)} />
                <label style={{ ...st.label, marginTop: 10 }}>Data</label>
                <input style={st.input} type="date" value={dData} onChange={e => setDData(e.target.value)} />
                <button style={st.btnOrange} onClick={lancarDesconto}>➖ Lançar vale/desconto</button>
              </div>
            )}

            {subAba === 'resumo' && (
              <>
                <button style={st.btn} onClick={loadData}>🔄 Atualizar</button>
                {nomes.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum lançamento esta semana.</div>}
                {nomes.map(nome => {
                  const lancs = motoboysSemana.filter(m => m.nome === nome)
                  const descs = descontosSemana.filter(d => d.nome === nome)
                  const pg = pago(nome)
                  const cadastro = getCadastro(nome)
                  return (
                    <div key={nome} style={st.card}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ fontSize: 15, fontWeight: 700 }}>🛵 {nome}</div>
                        <button onClick={() => marcarPago(nome)} style={st.btnSmall(pg ? '#eaf3de' : '#fcebeb', pg ? '#3b6d11' : '#a32d2d')}>
                          {pg ? '✅ Pago' : '⏳ Pendente'}
                        </button>
                      </div>

                      {cadastro && (
                        <div style={st.pixBox}>
                          {cadastro.telefone && <div>📱 {cadastro.telefone}</div>}
                          {cadastro.chave_pix && <div>🔑 PIX: <strong>{cadastro.chave_pix}</strong></div>}
                        </div>
                      )}

                      <div style={st.sectionTitle}>Dias trabalhados</div>
                      {lancs.map(l => (
                        <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0', borderBottom: '0.5px solid #f0efe9' }}>
                          <span style={{ color: '#888780' }}>{new Date(l.data).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <span style={{ fontWeight: 500 }}>R$ {parseFloat(l.valor).toFixed(2)}</span>
                            <button onClick={() => deletarLancamento(l.id)} style={st.btnSmall('#f3f2ee', '#888780')}>🗑️</button>
                          </div>
                        </div>
                      ))}

                      {descs.length > 0 && (
                        <>
                          <div style={st.sectionTitle}>Vales/descontos</div>
                          {descs.map(d => (
                            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '4px 0', borderBottom: '0.5px solid #f0efe9' }}>
                              <span style={{ color: '#a32d2d' }}>{d.motivo || 'Desconto'}</span>
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <span style={{ color: '#a32d2d', fontWeight: 500 }}>-R$ {parseFloat(d.valor).toFixed(2)}</span>
                                <button onClick={() => deletarDesconto(d.id)} style={st.btnSmall('#f3f2ee', '#888780')}>🗑️</button>
                              </div>
                            </div>
                          ))}
                        </>
                      )}

                      <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e5e5e0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780' }}>
                          <span>Bruto</span><span>R$ {bruto(nome).toFixed(2)}</span>
                        </div>
                        {desc(nome) > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a32d2d' }}>
                            <span>Descontos</span><span>-R$ {desc(nome).toFixed(2)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#1a1a18', marginTop: 6 }}>
                          <span>💰 Líquido</span><span>R$ {liquido(nome).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}

        {aba === 'cadastro' && (
          <>
            <div style={st.card}>
              <label style={st.label}>Nome do motoboy</label>
              <input style={st.input} placeholder="Nome completo" value={cNome} onChange={e => setCNome(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Telefone</label>
              <input style={st.input} placeholder="(21) 99999-9999" value={cTel} onChange={e => setCTel(e.target.value)} />
              <label style={{ ...st.label, marginTop: 10 }}>Chave PIX</label>
              <input style={st.input} placeholder="CPF, email, telefone ou chave aleatória" value={cPix} onChange={e => setCPix(e.target.value)} />
              <button style={st.btnOrange} onClick={salvarCadastro}>💾 Salvar cadastro</button>
            </div>

            <div style={st.sectionTitle}>Motoboys cadastrados</div>
            {cadastros.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum cadastro ainda.</div>}
            {cadastros.map(c => (
              <div key={c.id} style={st.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 600 }}>🛵 {c.nome}</div>
                    {c.telefone && <div style={{ fontSize: 13, color: '#888780', marginTop: 2 }}>📱 {c.telefone}</div>}
                    {c.chave_pix && <div style={{ fontSize: 13, color: '#888780', marginTop: 2 }}>🔑 {c.chave_pix}</div>}
                  </div>
                  <button onClick={() => deletarCadastro(c.id)} style={st.btnSmall('#f3f2ee', '#888780')}>🗑️</button>
                </div>
              </div>
            ))}
          </>
        )}

        {aba === 'historico' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
              <button style={st.subTab(semanaOffset === 0)} onClick={() => setSemanaOffset(0)}>Atual</button>
              {[1,2,3,4].map(i => {
                const { inicio } = getSemana(i)
                return (
                  <button key={i} style={{ ...st.subTab(semanaOffset === i), whiteSpace: 'nowrap', padding: '8px 10px' }} onClick={() => setSemanaOffset(i)}>
                    {inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </button>
                )
              })}
            </div>

            <div style={{ fontSize: 13, color: '#888780', marginBottom: 12, textAlign: 'center' }}>
              {inicio.toLocaleDateString('pt-BR')} — {fim.toLocaleDateString('pt-BR')}
            </div>

            {nomes.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: '#888780' }}>Nenhum lançamento nesta semana.</div>}
            {nomes.map(nome => {
              const pg = pago(nome)
              return (
                <div key={nome} style={st.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>🛵 {nome}</div>
                    <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: pg ? '#eaf3de' : '#fcebeb', color: pg ? '#3b6d11' : '#a32d2d' }}>
                      {pg ? '✅ Pago' : '⏳ Pendente'}
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#888780' }}>
                      <span>Bruto</span><span>R$ {bruto(nome).toFixed(2)}</span>
                    </div>
                    {desc(nome) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#a32d2d' }}>
                        <span>Descontos</span><span>-R$ {desc(nome).toFixed(2)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: '#1a1a18', marginTop: 4 }}>
                      <span>💰 Líquido</span><span>R$ {liquido(nome).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}