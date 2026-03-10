const { db } = require('./db');

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
    });

    req.on('end', () => {
      if (!body) return resolve({});
      try {
        const json = JSON.parse(body);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    });

    req.on('error', (err) => reject(err));
  });
}

function handleRequest(req, res) {
  const { method, url } = req;

  // POST /order - criar pedido
  if (method === 'POST' && url === '/order') {
    return parseBody(req)
      .then((body) => {
        // validar campos obrigatórios
        if (!body.numeroPedido || body.valorTotal == null || !Array.isArray(body.items)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({ error: 'numeroPedido, valorTotal e items são obrigatórios' })
          );
        }

        // transformar pro formato do banco
        const orderId = body.numeroPedido;
        const value = Number(body.valorTotal);
        const creationDate = new Date(body.dataCriacao).toISOString();

        // começar uma transação "manual" (bem simples)
        const insertOrder = db.prepare(
          'INSERT INTO "Order" (orderId, value, creationDate) VALUES (?, ?, ?)'
        );
        const insertItem = db.prepare(
          'INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)'
        );

        insertOrder.run(orderId, value, creationDate);

        for (const item of body.items) {
          const productId = Number(item.idItem);
          const quantity = Number(item.quantidadeItem);
          const price = Number(item.valorItem);

          insertItem.run(orderId, productId, quantity, price);
        }

        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            orderId,
            value,
            creationDate,
            items: body.items.map((i) => ({
              productId: Number(i.idItem),
              quantity: Number(i.quantidadeItem),
              price: Number(i.valorItem),
            })),
          })
        );
      })
      .catch((err) => {
        console.error(err);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'JSON inválido' }));
      });
  }

  // GET /order/list - por enquanto, só pra testar
  if (method === 'GET' && url === '/order/list') {
    const rows = db
      .prepare('SELECT orderId, value, creationDate FROM "Order"')
      .all();

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(rows));
  }

  // Rota padrão
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
}

module.exports = { handleRequest };