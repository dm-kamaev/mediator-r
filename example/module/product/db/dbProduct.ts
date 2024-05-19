const products: Array<{ id: number; name: string; price: number; quantity: number }> = [
  {
    id: 1,
    name: 'Cheese',
    price: 2.82,
    quantity: 20,
  },
  {
    id: 2,
    name: 'Wine',
    price: 8,
    quantity: 100,
  },
  {
    id: 3,
    name: 'Milk',
    price: 1.32,
    quantity: 1500,
  },
];

export default {
  getByIds(ids: number[]) {
    const setIds = new Set(ids);
    return products.filter((el) => setIds.has(el.id));
  },
  getById(id: number) {
    return products.find((el) => el.id === id);
  },
  update(selector: { id: number }, data: Partial<(typeof products)[number]>) {
    for (const [i, product] of products.entries()) {
      if (product.id === selector.id) {
        products[i] = Object.assign({}, product, data);
        break;
      }
    }
  },
};
