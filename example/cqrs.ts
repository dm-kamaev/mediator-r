/* eslint-disable prefer-const */
/* eslint-disable no-use-before-define */
import MediatorR, { CreateProvider } from '../index';

import product from './module/product/index.cq';
import * as Product from './module/product/index.cq.type';

import order from './module/order/index.cq';
import * as Order from './module/order/index.cq.type';

const schema = {
  product: {
    toBook: {
      action: (payload: Product.ToBookCommand['payload']) => new product.toBook.action(payload),
      handler: () => new product.toBook.handler(),
      exec: (payload: Product.ToBookCommand['payload']) => mediatorR.exec(mediatorR.action.product.toBook(payload)),
    },
    getByIds: {
      action: (id: Product.GetByIdsQuery['payload']) => new product.getByIds.action(id),
      handler: () => new product.getByIds.handler(),
      exec: (payload: Product.GetByIdsQuery['payload']) => mediatorR.exec(mediatorR.action.product.getByIds(payload)),
    },
  },
  order: {
    create: {
      action: (payload: Order.CreateCommand['payload']) => new order.create.action(payload, { getByIds: provider.product.getByIds }),
      handler: () => new order.create.handler({ getByIds: provider.product.getByIds, toBook: provider.product.toBook }),
      exec: (payload: Order.CreateCommand['payload']) => mediatorR.exec(mediatorR.action.order.create(payload)),
    },
    getById: {
      action: (payload: Order.GetByIdQuery['payload']) => new order.getById.action(payload),
      handler: () => {
        const result = new order.getById.handler({ getByIds: provider.product.getByIds });
        return result;
      },
      exec: async (payload: number) => {
        const action = mediatorR.action.order.getById(payload);
        const result = await mediatorR.exec(action);
        return result;
      },
    },
  },
};

export type Provider = CreateProvider<typeof schema>;
export let mediatorR: MediatorR<typeof schema>;
export let provider: Provider;

mediatorR = new MediatorR(schema);
provider = mediatorR.provider;

void async function () {
  const action = mediatorR.action.order.getById(1);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const result2 = await mediatorR.exec(action);
  const { id: orderId } = await provider.order.create([
    //            ^?
    { product_id: 1, quantity: 50 },
    { product_id: 3, quantity: 50 },
  ]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const order = await provider.order.getById(orderId);
  //     ^?
};
