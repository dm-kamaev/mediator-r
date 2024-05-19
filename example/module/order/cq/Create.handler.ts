import { ICommandHandler } from '../../../../index';
import type { Provider } from '../../../cqrs';
import dbOrder from '../db/dbOrder';
import type { CreateCommand } from './Create.command';

export class CreateHandler implements ICommandHandler<CreateCommand, { id: number }> {
  readonly __tag = 'command:order.create';

  constructor(
    private readonly productModule: {
      toBook: Provider['product']['toBook'];
      getByIds: Provider['product']['getByIds'];
    },
  ) {}

  async exec({ payload: listToBooked }: CreateCommand) {
    const products: Array<{ id: number; quantity: number; price: number }> = [];
    const hashPrice = await this.getHashPrice(listToBooked.map((el) => el.product_id));
    for await (const toBooked of listToBooked) {
      const { quantityBooked } = await this.productModule.toBook({ id: toBooked.product_id, quantity: toBooked.quantity });
      if (quantityBooked !== 0) {
        products.push({
          id: toBooked.product_id,
          quantity: quantityBooked,
          price: hashPrice[toBooked.product_id],
        });
      }
    }

    const order = {
      products,
      total: products.reduce((sum, el) => sum + el.price * el.quantity, 0),
    };

    const { insertId: id } = dbOrder.create(order);

    return { id };
  }

  private async getHashPrice(ids: number[]) {
    const products = await this.productModule.getByIds(ids);
    const hashProducts: Record<number, number> = {};
    products.forEach((el) => {
      hashProducts[el.id] = el.price;
    });
    return hashProducts;
  }
}
