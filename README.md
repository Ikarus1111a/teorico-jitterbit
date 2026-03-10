## API de Pedidos – Resumo Prático

Esta API foi feita em **Node.js** usando somente o módulo **HTTP nativo** e um banco **SQL (SQLite)**.
Ela gerencia pedidos (`Order`) e itens (`Items`).

Base URL padrão:

```text
http://localhost:3000
```

---

### Como rodar o projeto

1. Instalar dependências:

```bash
npm install
```

2. Subir o servidor:

```bash
npm start
```

3. A API ficará escutando na porta **3000**.

---

### Banco de dados (visão rápida)

- Banco: **SQLite** (arquivo `database.sqlite` na raiz)
- Tabelas criadas automaticamente em `src/db.js`:

**Order**
- `orderId` (PK)
- `value`
- `creationDate`

**Items**
- `id` (PK)
- `orderId` (FK → `Order.orderId`)
- `productId`
- `quantity`
- `price`

---

### Formato de entrada (body) esperado

Para criar/atualizar um pedido, o corpo da requisição segue o modelo do enunciado:

```json
{
  "numeroPedido": "v10089015vdb-01",
  "valorTotal": 10000,
  "dataCriacao": "2023-07-19T12:24:11.5299601+00:00",
  "items": [
    {
      "idItem": "2434",
      "quantidadeItem": 1,
      "valorItem": 1000
    }
  ]
}
```

Mapping para o banco:

- `numeroPedido` → `orderId`
- `valorTotal` → `value`
- `dataCriacao` → `creationDate`
- `idItem` → `productId`
- `quantidadeItem` → `quantity`
- `valorItem` → `price`

---

### Endpoints disponíveis

#### POST `/order`

Cria um novo pedido com itens.

- **Body**: JSON no formato acima.
- **Respostas**:
  - `201 Created` → pedido criado (retorna já no formato com `orderId`, `value`, `creationDate`, `items`).
  - `400 Bad Request` → JSON inválido ou campos obrigatórios ausentes.

#### GET `/order/{orderId}`

Obtém um pedido pelo número.

- Exemplo: `GET /order/v10089015vdb-01`
- **Respostas**:
  - `200 OK` → retorna o pedido completo (dados + items).
  - `404 Not Found` → pedido não existe.

#### GET `/order/list`

Lista todos os pedidos cadastrados.

- **Resposta**:
  - `200 OK` → array de pedidos (cada um com `orderId`, `value`, `creationDate`).

#### PUT `/order/{orderId}`

Atualiza um pedido existente.

- Usa o `orderId` da URL.
- **Body**: segue o mesmo formato de criação (usa `valorTotal`, `dataCriacao`, `items`).
- Comportamento:
  - Atualiza os dados na tabela `Order`.
  - Remove itens antigos e insere os novos na tabela `Items`.

#### DELETE `/order/{orderId}`

Remove um pedido e seus itens associados.

- **Respostas**:
  - `200 OK` → `{ "message": "Pedido deletado com sucesso" }`
  - `404 Not Found` → pedido não existe.

---

### Testes com REST Client (VS Codium / Code)

O arquivo `requests.http` contém exemplos de chamadas:

- Criar pedido (`POST /order`)
- Listar pedidos (`GET /order/list`)
- Buscar pedido por id (`GET /order/{orderId}`)

Com a extensão **REST Client**, abra o `requests.http` e clique em **“Send Request”** em cada bloco para testar a API.

