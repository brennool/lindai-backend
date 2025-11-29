# LindAI Backend API

Backend API para captura de leads, CRM local e integração com Mercado Pago.

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
cd server
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Edite o `.env` e configure suas credenciais do Mercado Pago:

```env
MP_ACCESS_TOKEN=seu_token_real_aqui
WEBHOOK_SECRET=seu_secret_aleatorio_aqui
```

### 3. Iniciar Servidor

```bash
npm start
```

O servidor estará rodando em `http://localhost:3001`

## 📡 Endpoints da API

### 1. Captura de Lead

**POST** `/api/lead/capture`

Captura um novo lead e salva no banco de dados com status `PENDENTE`.

**Request Body:**
```json
{
  "name": "Maria Silva",
  "whatsapp": "11987654321",
  "email": "maria@example.com"
}
```

**Response (201):**
```json
{
  "success": true,
  "leadId": 1,
  "message": "Lead capturado com sucesso!",
  "data": {
    "id": 1,
    "name": "Maria Silva",
    "status": "PENDENTE"
  }
}
```

**Validações:**
- Nome: mínimo 2 caracteres
- WhatsApp: 10-11 dígitos (formato brasileiro)
- Email: formato válido

---

### 2. Gerar Pagamento PIX

**POST** `/api/payment/generate`

Gera um pagamento PIX para o lead. **Atualmente retorna dados simulados (placeholder).**

**Request Body:**
```json
{
  "leadId": 1
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Pagamento gerado com sucesso",
  "payment": {
    "success": true,
    "pix_code": "00020126580014br.gov.bcb.pix...",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=...",
    "amount": 47.00,
    "lead_id": 1,
    "expires_at": "2025-11-25T01:00:00.000Z",
    "message": "PLACEHOLDER: Este é um QR Code simulado..."
  }
}
```

**Nota:** Para usar pagamentos reais, configure `MP_ACCESS_TOKEN` no `.env`.

---

### 3. Webhook do Mercado Pago

**POST** `/api/payment/webhook`

Recebe notificações de pagamento do Mercado Pago e atualiza o status do lead para `PAGO`.

**Request Body (exemplo do Mercado Pago):**
```json
{
  "type": "payment",
  "action": "payment.updated",
  "data": {
    "id": "123456789",
    "status": "approved",
    "external_reference": "1"
  }
}
```

**Response (200):**
```json
{
  "received": true,
  "message": "Webhook processed successfully"
}
```

**Headers:**
- `x-signature` ou `x-mercadopago-signature`: Assinatura do webhook (validada se `WEBHOOK_SECRET` estiver configurado)

---

### 4. Verificar Status de Pagamento

**GET** `/api/payment/status/:leadId`

Verifica o status de pagamento de um lead.

**Response (200):**
```json
{
  "success": true,
  "leadId": 1,
  "status": "PAGO",
  "paymentId": "123456789",
  "updatedAt": "2025-11-25 00:30:00"
}
```

---

### 5. Estatísticas de Leads (CRM)

**GET** `/api/lead/stats`

Retorna estatísticas de leads por status.

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "PENDENTE": 5,
    "PAGO": 12,
    "total": 17
  }
}
```

---

### 6. Listar Leads (CRM)

**GET** `/api/lead/list?status=PAGO&limit=50&offset=0`

Lista todos os leads com filtros opcionais.

**Query Parameters:**
- `status` (opcional): Filtrar por status (`PENDENTE` ou `PAGO`)
- `limit` (opcional): Número de resultados (padrão: 50)
- `offset` (opcional): Paginação (padrão: 0)

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "leads": [
    {
      "id": 1,
      "name": "Maria Silva",
      "whatsapp": "11987654321",
      "email": "maria@example.com",
      "status": "PAGO",
      "payment_id": "123456789",
      "created_at": "2025-11-25 00:15:00",
      "updated_at": "2025-11-25 00:30:00"
    }
  ]
}
```

---

## 🗄️ Banco de Dados

### Tabela: `leads`

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | INTEGER | Primary key (auto-increment) |
| name | TEXT | Nome completo |
| whatsapp | TEXT | WhatsApp (apenas dígitos) |
| email | TEXT | E-mail |
| status | TEXT | `PENDENTE` ou `PAGO` |
| payment_id | TEXT | ID do pagamento no Mercado Pago |
| created_at | DATETIME | Data de criação |
| updated_at | DATETIME | Data de atualização |

**Localização:** `server/database/lindai.db` (SQLite)

---

## 🔐 Configuração do Mercado Pago

### 1. Obter Access Token

1. Acesse: https://www.mercadopago.com.br/developers/panel/credentials
2. Copie o **Access Token** (Production ou Test)
3. Cole no `.env`: `MP_ACCESS_TOKEN=seu_token_aqui`

### 2. Configurar Webhook

1. No painel do Mercado Pago, vá em **Webhooks**
2. Adicione a URL: `https://seu-dominio.com/api/payment/webhook`
3. Selecione o evento: **Payments**
4. Gere um secret e adicione no `.env`: `WEBHOOK_SECRET=seu_secret_aqui`

---

## 🧪 Testando a API

### Usando cURL

**Capturar Lead:**
```bash
curl -X POST http://localhost:3001/api/lead/capture \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Silva",
    "whatsapp": "11987654321",
    "email": "maria@example.com"
  }'
```

**Gerar Pagamento:**
```bash
curl -X POST http://localhost:3001/api/payment/generate \
  -H "Content-Type: application/json" \
  -d '{"leadId": 1}'
```

**Simular Webhook:**
```bash
curl -X POST http://localhost:3001/api/payment/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment",
    "action": "payment.updated",
    "data": {
      "id": "123456789",
      "status": "approved"
    },
    "leadId": 1
  }'
```

---

## 📁 Estrutura do Projeto

```
server/
├── src/
│   ├── controllers/
│   │   ├── leadController.js      # Lógica de captura de leads
│   │   └── paymentController.js   # Lógica de pagamentos
│   ├── database/
│   │   └── db.js                  # Conexão SQLite
│   ├── models/
│   │   └── Lead.js                # Model de Lead (CRUD)
│   ├── routes/
│   │   ├── leadRoutes.js          # Rotas de leads
│   │   └── paymentRoutes.js       # Rotas de pagamento
│   ├── utils/
│   │   ├── validators.js          # Validações
│   │   └── mercadoPagoHelper.js   # Helper do Mercado Pago
│   └── index.js                   # Servidor Express
├── database/
│   └── lindai.db                  # Banco SQLite (criado automaticamente)
├── .env.example                   # Template de variáveis
├── .gitignore
├── package.json
└── README.md
```

---

## 🔄 Fluxo Completo

1. **Frontend** → Usuário preenche formulário
2. **POST /api/lead/capture** → Lead salvo com status `PENDENTE`
3. **Frontend** → Usuário completa análise
4. **POST /api/payment/generate** → PIX gerado
5. **Frontend** → Exibe QR Code
6. **Usuário** → Paga via PIX
7. **Mercado Pago** → Envia webhook
8. **POST /api/payment/webhook** → Status atualizado para `PAGO`
9. **Backend** → Envia produto digital (BeautyPlan PDF)

---

## 🛠️ Desenvolvimento

### Modo Watch (auto-reload)

```bash
npm run dev
```

### Health Check

```bash
curl http://localhost:3001/health
```

---

## 📝 TODO

- [ ] Integrar Mercado Pago SDK real (substituir placeholder)
- [ ] Adicionar envio de e-mail de confirmação
- [ ] Adicionar envio de WhatsApp com produto
- [ ] Implementar rate limiting
- [ ] Adicionar testes automatizados
- [ ] Deploy em produção (Heroku/Railway/Vercel)

---

## 📞 Suporte

Para dúvidas ou problemas, entre em contato: contato@lindai.com.br
