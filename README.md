# WayMB Checkout — Next.js + Vercel

## Deploy

### 1. Sobe no GitHub
```bash
git init
git add .
git commit -m "first commit"
git remote add origin https://github.com/SEU_USER/waymb-checkout.git
git push -u origin main
```

### 2. Importa na Vercel
vercel.com → New Project → importa o repositório → Deploy

### 3. Variáveis de ambiente
Vercel → Settings → Environment Variables:

| Variável | Valor |
|---|---|
| `WAYMB_CLIENT_ID` | `davi.copy_91ca2801` |
| `WAYMB_CLIENT_SECRET` | `cd4ec68b-ebed-4d7b-a0c8-45eb8ce13e60` |
| `WAYMB_ACCOUNT_EMAIL` | o teu e-mail da conta WayMB |

Depois: **Redeploy**

---

## URL com parâmetros

```
https://teu-site.vercel.app/?name=TikTok&amount=9.90&description=Recarga+TikTok&timer=10
```

| Parâmetro | Descrição |
|---|---|
| `name` | Nome do produto |
| `amount` | Valor em EUR |
| `description` | Subtítulo |
| `logo` | URL da imagem do logo |
| `timer` | Minutos do contador (default: 10) |
