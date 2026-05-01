export default async function handler(req, res) {
  // Always respond 200 immediately so WayMB confirms delivery
  res.status(200).json({ received: true })

  if (req.method !== 'POST') return

  const { transactionId, id, status, amount, currency, payer } = req.body
  const txId = transactionId || id

  try {
    switch (status) {
      case 'COMPLETED':
        console.log(`[WEBHOOK] ✅ Pagamento confirmado — TX: ${txId} | ${amount} ${currency} | ${payer?.name}`)
        // TODO: atualizar base de dados, enviar e-mail, etc.
        break
      case 'DECLINED':
        console.log(`[WEBHOOK] ❌ Pagamento recusado — TX: ${txId}`)
        break
      case 'PENDING':
        console.log(`[WEBHOOK] ⏳ Pagamento pendente — TX: ${txId}`)
        break
      default:
        console.log(`[WEBHOOK] ❓ Status desconhecido: ${status} — TX: ${txId}`)
    }
  } catch (err) {
    console.error('[WEBHOOK] Erro ao processar:', err)
  }
}
