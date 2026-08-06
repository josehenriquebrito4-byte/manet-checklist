'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

const POLL_MS = 12000
const JANELA_MINUTOS_FALLBACK = 18
const ALERTA_FALTAM_MINUTOS = 5 // pisca quando faltar isso pro pedido sair do painel

function elapsedMinutes(readyAtIso) {
  return (Date.now() - new Date(readyAtIso).getTime()) / 60000
}

function Coluna({ titulo, cor, corTexto, corCardBg, corCardBorda, pedidos, janelaMinutos }) {
  const st = {
    col: { flex: 1, background: cor, color: corTexto, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' },
    header: { padding: '20px 28px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexShrink: 0 },
    titulo: { fontSize: 44, fontWeight: 800, letterSpacing: 0.5 },
    contador: { fontSize: 28, fontWeight: 700, opacity: 0.85 },
    grid: { flex: 1, overflowY: 'auto', padding: '4px 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 },
    vazio: { margin: 'auto', fontSize: 28, fontWeight: 600, opacity: 0.6, textAlign: 'center' },
    card: { background: corCardBg, border: `3px solid ${corCardBorda}`, borderRadius: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 },
    cardAlerta: { animation: 'piscaAlerta 1s ease-in-out infinite' },
    saleInfo: { display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 },
    cliente: { fontSize: 24, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 },
    itens: { fontSize: 15, fontWeight: 500, opacity: 0.75, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 320 },
    pedidoBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 },
    pedidoReal: { fontSize: 52, fontWeight: 800, lineHeight: 1, fontVariantNumeric: 'tabular-nums' },
    pedidoInterno: { fontSize: 15, fontWeight: 600, opacity: 0.7 },
  }

  return (
    <div style={st.col}>
      <div style={st.header}>
        <div style={st.titulo}>{titulo}</div>
        <div style={st.contador}>{pedidos.length} pronto{pedidos.length !== 1 ? 's' : ''}</div>
      </div>
      <div style={st.grid}>
        {pedidos.length === 0 && <div style={st.vazio}>Nenhum pedido pronto</div>}
        {pedidos.map(p => {
          const minutos = elapsedMinutes(p.readyAt)
          const alerta = minutos >= (janelaMinutos - ALERTA_FALTAM_MINUTOS)
          return (
            <div key={p.idSale} style={{ ...st.card, ...(alerta ? st.cardAlerta : {}) }}>
              <div style={st.saleInfo}>
                <div style={st.cliente}>{p.cliente}</div>
                {p.itens.length > 0 && <div style={st.itens}>{p.itens.join(' + ')}</div>}
              </div>
              <div style={st.pedidoBox}>
                <div style={st.pedidoReal}>#{p.pedidoReal}</div>
                <div style={st.pedidoInterno}>interno #{p.saleNumber}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PainelDespacho() {
  const [dados, setDados] = useState(null)
  const lastOkRef = useRef(null)

  const fetchDados = useCallback(async () => {
    try {
      const res = await fetch('/api/painel-despacho')
      const result = await res.json()
      if (result.ok) {
        setDados(result)
        lastOkRef.current = new Date()
      }
    } catch (e) {
      // silencioso: mantém os dados anteriores na tela, retry automático já cobre falhas transitórias
    }
  }, [])

  useEffect(() => {
    fetchDados()
    const poll = setInterval(fetchDados, POLL_MS)
    return () => clearInterval(poll)
  }, [fetchDados])

  const janelaMinutos = dados?.janelaMinutos || JANELA_MINUTOS_FALLBACK
  const pedidos = dados?.pedidos || []
  const ifood = pedidos.filter(p => p.canal === 'iFood')
  const noventaNove = pedidos.filter(p => p.canal === '99 Food')

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', fontFamily: "'DM Sans', system-ui, sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes piscaAlerta {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0.5); }
          50% { box-shadow: 0 0 0 6px rgba(255,255,255,0); }
        }
        html, body { margin: 0; padding: 0; }
      `}</style>
      <Coluna
        titulo="🔴 iFood"
        cor="#EA1D2C"
        corTexto="#fff"
        corCardBg="rgba(255,255,255,0.12)"
        corCardBorda="rgba(255,255,255,0.35)"
        pedidos={ifood}
        janelaMinutos={janelaMinutos}
      />
      <Coluna
        titulo="🟡 99Food"
        cor="#FFC700"
        corTexto="#1a1a18"
        corCardBg="rgba(0,0,0,0.08)"
        corCardBorda="rgba(0,0,0,0.25)"
        pedidos={noventaNove}
        janelaMinutos={janelaMinutos}
      />
    </div>
  )
}
