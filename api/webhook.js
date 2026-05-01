module.exports = async function handler(req, res) {
  // Always respond 200 immediately so WayMB confirms delivery
  res.status(200).json({ received: true });

  if (req.method !== "POST") return;

  const {
    transactionId,
    id,
    status,
    amount,
    currency,
    email,
    payer,
    updatedAt,
  } = req.body;

  const txId = transactionId || id;

  try {
    switch (status) {
      case "COMPLETED":
        console.log(`[WEBHOOK] ✅ Pagamento confirmado — TX: ${txId} | Valor: ${amount} ${currency} | Pagador: ${payer?.name} <${payer?.email}>`);
        // TODO: Atualizar base de dados, enviar e-mail de confirmação, etc.
        break;

      case "DECLINED":
        console.log(`[WEBHOOK] ❌ Pagamento recusado — TX: ${txId}`);
        // TODO: Notificar utilizador, reverter reserva, etc.
        break;

      case "PENDING":
        console.log(`[WEBHOOK] ⏳ Pagamento pendente — TX: ${txId}`);
        break;

      default:
        console.log(`[WEBHOOK] ❓ Status desconhecido: ${status} — TX: ${txId}`);
    }
  } catch (err) {
    // Never let this throw — 200 was already sent
    console.error("[WEBHOOK] Erro ao processar:", err);
  }
}
