import { provider } from './cqrs';

void (async function () {
  {
    // const provider: Provider = _provider;
    // const provider = mediator.provider;

    const { id: orderId } = await provider.order.create([
      //         ^?
      { product_id: 1, quantity: 50 },
      { product_id: 3, quantity: 50 },
    ]);
    const order = await provider.order.getById(orderId);
    //      ^?
    console.log('order => ', order, order.id);
    const products = await provider.product.getByIds(order.products.map((el) => el.id));
    //    ^?
    console.log('products => ', products);
    const { quantityBooked } = await provider.product.toBook({ id: 3, quantity: 1600 });
    //      ^?
    console.log('quantityBooked => ', quantityBooked);
  }
})();
