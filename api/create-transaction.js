module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { amount, method, payer, paymentDescription, currency } = req.body;

  // Validate required fields
  if (!amount || !method || !payer) {
    return res.status(400).json({ error: "Missing required fields: amount, method, payer" });
  }
  if (!payer.name || !payer.email || !payer.phone || !payer.document) {
    return res.status(400).json({ error: "Missing payer fields: name, email, phone, document" });
  }

  const CLIENT_ID     = process.env.WAYMB_CLIENT_ID     || "davi.copy_91ca2801";
  const CLIENT_SECRET = process.env.WAYMB_CLIENT_SECRET || "cd4ec68b-ebed-4d7b-a0c8-45eb8ce13e60";
  const ACCOUNT_EMAIL = process.env.WAYMB_ACCOUNT_EMAIL || "";

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.BASE_URL || "https://localhost:3000");

  const body = {
    client_id:          CLIENT_ID,
    client_secret:      CLIENT_SECRET,
    account_email:      ACCOUNT_EMAIL,
    amount:             parseFloat(amount),
    method,
    payer,
    currency:           currency || "EUR",
    paymentDescription: (paymentDescription || "Transaction Payment").slice(0, 50),
    callbackUrl:        `${baseUrl}/api/webhook`,
  };

  try {
    const response = await fetch("https://api.waymb.com/transactions/create", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error("WayMB create error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
