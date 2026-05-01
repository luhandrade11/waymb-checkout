import Head from 'next/head'
import { useEffect, useState } from 'react'

export default function Checkout() {
  const [params, setParams]     = useState({ name: 'TikTok', amount: 9.90, description: 'TikTok', logo: '', timer: 10 })
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
        a { color: inherit; text-decoration: none; }

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
          width: 56px; height: 56px; border-radius: 50%;
          background: #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 1rem; overflow: hidden; flex-shrink: 0;
        }
        .product-logo img { width: 150%; height: 150%; object-fit: cover; border-radius: 50%; }
        .product-logo-letter { color: #fff; font-size: 1.4rem; font-weight: 800; }
        .product-name-header { font-size: 1.05rem; font-weight: 700; margin-bottom: .2rem; }
        .product-secure { font-size: .78rem; color: #888; font-weight: 400; }

        /* ── Payment card ── */
        .payment-card { padding: 1.25rem; }
        .payment-title { font-size: .95rem; font-weight: 700; margin-bottom: .1rem; }
        .payment-sub   { font-size: .78rem; color: #888; margin-bottom: 1rem; }

        .total-box {
          background: #f7f7f7; border-radius: 10px;
          padding: .85rem 1rem; text-align: center; margin-bottom: 1rem;
        }
        .total-label { font-size: .75rem; color: #888; margin-bottom: .25rem; }
        .total-value { font-size: 1.65rem; font-weight: 700; color: #F0004F; letter-spacing: -.02em; }

        /* method tabs */
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
        .method-tab:not(.active):hover { border-color: #F0004F; color: #F0004F; }

        /* phone input */
        .phone-group {
          display: flex; border: 1.5px solid #d8d8d8;
          border-radius: 10px; overflow: hidden;
          margin-bottom: 1rem; transition: border-color .15s;
        }
        .phone-group:focus-within { border-color: #F0004F; }
        .phone-prefix {
          display: flex; align-items: center; gap: .4rem;
          padding: .75rem .9rem;
          border-right: 1.5px solid #d8d8d8;
          font-size: .88rem; font-weight: 500;
          background: #fafafa; flex-shrink: 0;
        }
        .phone-input {
          flex: 1; border: none; outline: none;
          padding: .75rem .9rem;
          font-size: .88rem; font-family: 'Inter', sans-serif;
          color: #1a1a1a; background: transparent;
        }
        .phone-input::placeholder { color: #bbb; }

        /* terms */
        .terms-wrap {
          display: flex; align-items: center; gap: .6rem;
          border: 1.5px solid #e8e8e8; border-radius: 10px;
          padding: .75rem .9rem; margin-bottom: 1rem;
          cursor: pointer; font-size: .82rem; color: #888;
        }
        .terms-check {
          width: 18px; height: 18px; accent-color: #F0004F;
          cursor: pointer; flex-shrink: 0;
        }
        .terms-link { color: #F0004F; font-weight: 500; }

        /* error */
        .error-msg {
          background: rgba(240,0,79,.08); border: 1px solid rgba(240,0,79,.2);
          border-radius: 8px; color: #F0004F;
          font-size: .78rem; padding: .6rem .85rem; margin-bottom: .85rem;
        }

        /* pay button */
        .btn-pay {
          width: 100%; padding: .9rem; border-radius: 50px;
          background: #F0004F; border: none; color: #fff;
          font-size: .95rem; font-weight: 700; cursor: pointer;
          font-family: 'Inter', sans-serif; letter-spacing: .01em;
          transition: opacity .15s, transform .1s;
          display: flex; align-items: center; justify-content: center; gap: .5rem;
        }
        .btn-pay:hover:not(:disabled) { opacity: .9; }
        .btn-pay:active:not(:disabled) { transform: scale(.99); }
        .btn-pay:disabled { opacity: .65; cursor: not-allowed; }

        /* success states */
        .success-box {
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          padding: 1.25rem 1rem 1rem;
        }
        .success-title  { font-size: 1rem; font-weight: 700; margin-bottom: .35rem; }
        .success-amount { font-size: 1.1rem; font-weight: 700; color: #F0004F; margin-bottom: 1.25rem; }

        .mb-info { font-size: .85rem; line-height: 2; margin-bottom: 1.25rem; text-align: center; }
        .mb-info strong { font-weight: 700; }
        .mb-info .red { color: #F0004F; font-weight: 700; }

        /* polling dots */
        .polling { display: flex; align-items: center; justify-content: center; gap: .4rem; padding-top: .85rem; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #aaa; animation: pulse 1.2s ease-in-out infinite; }
        .dot:nth-child(2) { animation-delay: .2s; }
        .dot:nth-child(3) { animation-delay: .4s; }
        @keyframes pulse { 0%,100%{opacity:.25} 50%{opacity:1} }
        .polling-text { font-size: .78rem; color: #888; margin-left: .3rem; }

        /* completed */
        .completed-icon {
          width: 56px; height: 56px; border-radius: 50%;
          background: rgba(34,197,94,.12); border: 2px solid rgba(34,197,94,.3);
          display: flex; align-items: center; justify-content: center; margin-bottom: 1rem;
        }

        /* spinner */
        .spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: #fff; border-radius: 50%;
          animation: spin .65s linear infinite; flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* TOP BANNER */}
      <div className="banner">
        ⏰ Oferta expira em {fmtMin}:{fmtSec}
      </div>

      <div className="page">

        {/* PRODUCT HEADER CARD */}
<div className="card product-card">
  <div className="product-logo">
    {/* 
        DICA: Substitua o link abaixo pela URL da imagem que você desejar.
        Se 'params.logo' vier na URL, ele terá prioridade. 
    */}
    { (params.logo || "https://i.postimg.cc/L4fzn491/7safpbsxoywisudmovpfonxnj.gif") ? (
      <img 
        src={params.logo || "https://i.postimg.cc/L4fzn491/7safpbsxoywisudmovpfonxnj.gif"} 
        alt={params.name} 
        onError={(e) => { 
          e.target.style.display = 'none';
          // Se a imagem falhar, podemos mostrar a letra como fallback
          e.target.nextSibling.style.display = 'block';
        }}
      />
    ) : null}
    
    {/* Este span só aparece se não houver imagem ou se ela falhar */}
    {!params.logo && !params.name.charAt(0) && (
      <span className="product-logo-letter">
        {params.name.charAt(0).toUpperCase()}
      </span>
    )}
  </div>
  <div className="product-name-header">{params.name}</div>
  <div className="product-secure">Pagamento seguro • WayMB</div>
</div>

        {/* PAYMENT CARD */}
        <div className="card payment-card">
          <div className="payment-title">{params.name}</div>
          <div className="payment-sub">{params.description}</div>

          {/* Total */}
          <div className="total-box">
            <div className="total-label">Total a pagar</div>
            <div className="total-value">{fmtAmount}</div>
          </div>

          {/* FORM STATE */}
          {uiState === 'form' && (
            <>
              {/* Method tabs */}
              <div className="method-tabs">
                <button
                  className={`method-tab${method === 'mbway' ? ' active' : ''}`}
                  onClick={() => setMethod('mbway')}
                >MB WAY</button>
                <button
                  className={`method-tab${method === 'multibanco' ? ' active' : ''}`}
                  onClick={() => setMethod('multibanco')}
                >Multibanco</button>
              </div>

              {/* Phone — MB WAY only */}
              {method === 'mbway' && (
                <div className="phone-group">
                  <div className="phone-prefix">🇵🇹 +351</div>
                  <input
                    className="phone-input"
                    type="tel"
                    placeholder="912 345 678"
                    inputMode="numeric"
                    value={phone}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                  />
                </div>
              )}

              {/* Terms */}
              <label className="terms-wrap">
                <input
                  className="terms-check"
                  type="checkbox"
                  checked={terms}
                  onChange={e => setTerms(e.target.checked)}
                />
                <span>Li e aceito os <span className="terms-link">Termos e Condições</span></span>
              </label>

              {/* Error */}
              {error && <div className="error-msg">{error}</div>}

              {/* Pay button */}
              <button className="btn-pay" onClick={handlePay} disabled={loading}>
                {loading ? <><div className="spinner"/><span>A processar...</span></> : 'Pagar agora'}
              </button>
            </>
          )}

          {/* MB WAY STATE */}
          {uiState === 'mbway' && (
            <div className="success-box">
              <div className="success-title">Aprove no MB WAY</div>
              <div className="success-amount">{fmtAmount}</div>
              <MbwayLogo/>
              <div className="polling">
                <div className="dot"/><div className="dot"/><div className="dot"/>
                <span className="polling-text">A aguardar confirmação...</span>
              </div>
            </div>
          )}

          {/* MULTIBANCO STATE */}
          {uiState === 'multibanco' && (
            <div className="success-box">
              <div className="success-title">Pagamento Multibanco</div>
              <div className="mb-info">
                Entidade: <strong>{txData?.referenceData?.entity || '—'}</strong><br/>
                Referência: <strong>{txData?.referenceData?.reference || '—'}</strong><br/>
                Valor: <span className="red">{fmtAmount}</span>
              </div>
              <MultibancoLogo/>
            </div>
          )}

          {/* COMPLETED STATE */}
          {uiState === 'completed' && (
            <div className="success-box">
              <div className="completed-icon">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <div style={{fontSize:'1rem',fontWeight:700,marginBottom:'.3rem'}}>Pagamento confirmado!</div>
              <div style={{fontSize:'.82rem',color:'#888',lineHeight:1.5}}>
                O teu pagamento de <strong style={{color:'#F0004F'}}>{fmtAmount}</strong> foi recebido com sucesso.
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}

function MbwayLogo() {
  return (
    <svg width="160" viewBox="0 0 210 85" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="90" height="65" rx="11" ry="11" fill="none" stroke="#1a1a1a" strokeWidth="5"/>
      <rect x="3" y="51" width="90" height="17" rx="0" fill="#F0004F"/>
      <path d="M3 51 h90 v7 a11 11 0 0 1-11 11 H14 a11 11 0 0 1-11-11 z" fill="#F0004F"/>
      <text x="48" y="47" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="32" fontWeight="800" fill="#1a1a1a">MB</text>
      <text x="153" y="60" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="36" fontWeight="800" fill="#1a1a1a">WAY</text>
    </svg>
  )
}

function MultibancoLogo() {
  return (
    <svg width="130" viewBox="0 0 150 125" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="142" height="95" rx="13" ry="13" fill="none" stroke="#1a6bc4" strokeWidth="5"/>
      <text x="75" y="68" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="46" fontWeight="900" fill="#1a1a1a">MB</text>
      <text x="75" y="115" textAnchor="middle" fontFamily="Inter,sans-serif" fontSize="13" fontWeight="700" fill="#555" letterSpacing="2">MULTIBANCO</text>
    </svg>
  )
}
