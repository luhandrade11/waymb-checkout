# WayMB Checkout

Checkout page integrado com a API WayMB — pronto para deploy na Vercel.

## Deploy rápido

### 1. Sube o repositório no GitHub

```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SEU_USER/waymb-checkout.git
git push -u origin main
```

### 2. Conecta na Vercel

1. Acede a [vercel.com](https://vercel.com) → **New Project**
2. Importa o repositório do GitHub
3. Clica em **Deploy** (sem alterar nada)

### 3. Configura as variáveis de ambiente

Na Vercel: **Settings → Environment Variables** — adiciona:

| Variável | Valor |
|---|---|
| `WAYMB_CLIENT_ID` | `davi.copy_91ca2801` |
| `WAYMB_CLIENT_SECRET` | `cd4ec68b-ebed-4d7b-a0c8-45eb8ce13e60` |
| `WAYMB_ACCOUNT_EMAIL` | o teu e-mail da conta WayMB |

Depois faz **Redeploy** para aplicar as variáveis.

---

## URL do checkout

```
https://teu-dominio.vercel.app/
```

### Parâmetros opcionais via URL

| Parâmetro | Descrição | Exemplo |
|---|---|---|
| `name` | Nome do produto | `?name=TikTok` |
| `amount` | Valor em EUR | `?amount=9.90` |
| `description` | Subtítulo | `?description=Recarga+TikTok` |
| `logo` | URL da imagem do logo | `?logo=https://...` |
| `timer` | Minutos no contador (default 10) | `?timer=15` |

**Exemplo completo:**
```
https://teu-dominio.vercel.app/?name=TikTok&amount=9.90&description=Recarga+TikTok&timer=10
```

---

## Estrutura do projeto

```
waymb-checkout/
├── api/
│   ├── create-transaction.js   ← cria transação (proxy seguro)
│   ├── transaction-info.js     ← polling do status
│   └── webhook.js              ← recebe notificações WayMB
├── public/
│   └── index.html              ← checkout UI
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

## Fluxo de pagamento

```
Cliente preenche form
    ↓
POST /api/create-transaction
    ↓ (proxy seguro, credenciais no servidor)
WayMB API → cria transação
    ↓
MB WAY → mostra "Aprove no MB WAY" + polling a cada 3s
Multibanco → mostra Entidade / Referência / Valor
    ↓
Webhook POST /api/webhook → recebe COMPLETED / DECLINED
    ↓
Polling deteta status → UI atualiza automaticamente
```
