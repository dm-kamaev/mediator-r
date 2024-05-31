import Fastify from 'fastify';

import { provider } from '../cqrs';

const app = Fastify();

// curl -X POST http://127.0.0.1:4005/order  -H "Content-Type: application/json" -d '[{ "product_id": 1, "quantity": 50 }, { "product_id": 3, "quantity": 50 }]'
app.post<{
  Body: Array<{
    product_id: number;
    quantity: number;
  }>;
}>('/order', async function handler(req, reply) {
  const list = req.body;
  const order = await provider.order.create(list);
  reply.status(200).send({ id: order.id });
});

// curl -X GET http://127.0.0.1:4005/order/4980
app.get<{
  Params: {
    id: string;
  };
}>('/order/:id', async function handler(req, reply) {
  const id = parseInt(req.params.id, 10);
  const order = await provider.order.getById(id);
  reply.status(200).send(order);
});

// curl -X GET http://127.0.0.1:4005/product?ids=1,3
app.get<{
  Querystring: {
    ids: string;
  };
}>('/product', async function handler(req, reply) {
  const ids = req.query.ids.split(',').map((el) => parseInt(el, 10));
  const products = await provider.product.getByIds(ids);
  reply.status(200).send(products);
});

// curl -X POST http://127.0.0.1:4005/product/booked  -H "Content-Type: application/json" -d '{ "id": 3, "quantity": 1600 }'
app.post<{
  Body: {
    id: number;
    quantity: number;
  };
}>('/product/booked', async function handler(req, reply) {
  const toBook = req.body;
  const result = await provider.product.toBook(toBook);
  reply.status(200).send(result);
});

app.listen({ port: 4005 }, async function (err, address) {
  if (err) {
    throw err;
  }
  console.log('Server was started ' + address);
});
