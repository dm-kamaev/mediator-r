// import { bus as _bus, provider as _provider, Provider } from './cqrs'
// import { mediator, provider as _provider, Provider } from './cqrs'
import { provider } from './cqrs';
// import { IBus as ICQBus, IProvider } from './type';

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

  // {
  //   const bus: ICQBus = _bus;

  //   const { id: orderId } = await bus.exec(bus.action.order.create([{ product_id: 1, quantity: 50 }, { product_id: 3, quantity: 50 }]));
  //   //      ^?
  //   const order = await bus.exec(bus.action.order.getById(orderId));
  //   //      ^?
  //   console.log('order =>', order);
  //   const products = await bus.exec(bus.action.product.getByIds(order.products.map(el => el.id)));
  //   //    ^?
  //   console.log('products => ', products);
  //   const { quantityBooked } = await bus.exec(bus.action.product.toBook({ id: 3, quantity: 1600 }));
  //   //      ^?
  //   console.log('quantityBooked => ', quantityBooked);
  // }
})();

// void async function () {
//   {
//     const provider: IProvider = _provider;

//     const { ids: price_tag_ids } = await provider.price_tag.createBatch( [{ name: 'First', product_ids: [] }, { name: 'Second', product_ids: [], }]);

//     const { id: product_id } = await provider.product.create({ name: 'Blue cheese', price_tag_ids });
//     console.log({ product_id });
//     const product = await provider.product.getById(product_id);
//     console.log('product => ', product);
//     const product_by_name = await provider.product.getByName('Blue cheese');
//     console.log('product_by_name => ', product_by_name);
//   }

//   {
//     const bus: IBus = _bus;

//     const { ids: price_tag_ids } = await bus.exec(bus.action.price_tag.createBatch( [{ name: 'First', product_ids: [] }, { name: 'Second', product_ids: [], }]));

//     const { id: product_id } = await bus.exec(bus.action.product.create({ name: 'Blue cheese', price_tag_ids }, bus));
//     console.log({ product_id });
//     const product = await bus.exec(bus.action.product.getById(product_id));
//     console.log('product => ', product);
//     const product_by_name = await bus.exec(bus.action.product.getByName('Blue cheese'));
//     console.log('product_by_name => ', product_by_name);
//   }

// }();
