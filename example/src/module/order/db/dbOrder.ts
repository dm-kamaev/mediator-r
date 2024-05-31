import crypto from 'node:crypto';

const orders: Array<{ id: number; products: Array<{ id: number; price: number; quantity: number }>; total: number }> = [];

export default {
  getById(id: number) {
    return orders.find((el) => el.id === id);
  },
  create(order: Omit<(typeof orders)[number], 'id'>) {
    const id = crypto.randomInt(10000);
    orders.push({
      ...order,
      id,
    });
    return { insertId: id };
  },
};
