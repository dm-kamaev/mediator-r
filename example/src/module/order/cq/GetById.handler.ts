import { IQueryHandler } from '../../../../../src';
import type { Provider } from '../../../cqrs';
import dbOrder from '../db/dbOrder';
import type { GetByIdQuery } from './GetById.query';

export class GetByIdHandler
  implements
    IQueryHandler<
      GetByIdQuery,
      { id: number; products: Array<{ id: number; name: string; price: number; quantity: number }>; total: number }
    >
{
  readonly __tag = 'query:order.get-by-id';

  constructor(private readonly productModule: { getByIds: Provider['product']['getByIds'] }) {}

  async exec({ payload: id }: GetByIdQuery) {
    const order = dbOrder.getById(id);
    if (!order) {
      throw new Error(`Not found order with id = ${id}`);
    }
    const hashName = await this.getHashName(order.products.map((el) => el.id));

    return {
      ...order,
      products: order.products.map((el) => {
        return {
          ...el,
          name: hashName[el.id],
        };
      }),
    };
  }

  private async getHashName(ids: number[]) {
    const products = await this.productModule.getByIds(ids);
    const hashProducts: Record<number, string> = {};
    products.forEach((el) => {
      hashProducts[el.id] = el.name;
    });
    return hashProducts;
  }
}
