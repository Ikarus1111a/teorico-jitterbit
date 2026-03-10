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

  // GET /order/:orderId - buscar 1 pedido
  if (method === 'GET' && url.startsWith('/order/')) {
    const orderId = url.split('/order/')[1];

    if (!orderId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'orderId não informado' }));
    }

    const order = db
      .prepare('SELECT orderId, value, creationDate FROM "Order" WHERE orderId = ?')
      .get(orderId);

    if (!order) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Pedido não encontrado' }));
    }

    const items = db
      .prepare('SELECT productId, quantity, price FROM Items WHERE orderId = ?')
      .all(orderId);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(
      JSON.stringify({
        orderId: order.orderId,
        value: order.value,
        creationDate: order.creationDate,
        items: items,
      })
    );
  }

  // PUT /order/:orderId - atualizar pedido
  if (method === 'PUT' && url.startsWith('/order/')) {
    const orderId = url.split('/order/')[1];

    if (!orderId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'orderId não informado' }));
    }

    return parseBody(req)
      .then((body) => {
        if (body.valorTotal == null || !Array.isArray(body.items)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(
            JSON.stringify({ error: 'valorTotal e items são obrigatórios para atualizar' })
          );
        }

        const value = Number(body.valorTotal);
        const creationDate = body.dataCriacao
          ? new Date(body.dataCriacao).toISOString()
          : new Date().toISOString();

        const updateOrder = db.prepare(
          'UPDATE "Order" SET value = ?, creationDate = ? WHERE orderId = ?'
        );
        const deleteItems = db.prepare('DELETE FROM Items WHERE orderId = ?');
        const insertItem = db.prepare(
          'INSERT INTO Items (orderId, productId, quantity, price) VALUES (?, ?, ?, ?)'
        );

        const result = updateOrder.run(value, creationDate, orderId);

        if (result.changes === 0) {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: 'Pedido não encontrado' }));
        }

        deleteItems.run(orderId);

        for (const item of body.items) {
          const productId = Number(item.idItem);
          const quantity = Number(item.quantidadeItem);
          const price = Number(item.valorItem);

          insertItem.run(orderId, productId, quantity, price);
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(
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

  // DELETE /order/:orderId - apagar pedido
  if (method === 'DELETE' && url.startsWith('/order/')) {
    const orderId = url.split('/order/')[1];

    if (!orderId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'orderId não informado' }));
    }

    const stmt = db.prepare('DELETE FROM "Order" WHERE orderId = ?');
    const result = stmt.run(orderId);

    if (result.changes === 0) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Pedido não encontrado' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ message: 'Pedido deletado com sucesso' }));
  }

  // Rota padrão
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Rota não encontrada' }));
}

module.exports = { handleRequest };