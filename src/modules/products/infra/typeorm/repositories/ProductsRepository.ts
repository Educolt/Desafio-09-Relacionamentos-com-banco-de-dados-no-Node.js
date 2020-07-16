import { getRepository, Repository, In } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import AppError from '@shared/errors/AppError';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const listIds = products.map(p => p.id);
    const orderList = await this.ormRepository.find({ id: In(listIds) });

    if (listIds.length !== orderList.length) {
      throw new AppError('Missing Product');
    }

    return orderList;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const prodsData = await this.findAllById(products);

    const newProds = prodsData.map(pd => {
      const findProd = products.find(p => p.id === pd.id);

      if (!findProd) {
        throw new AppError('Product not find');
      }

      if (pd.quantity < findProd.quantity) {
        throw new AppError('Insufficient product quantity');
      }

      const newProd = pd;

      newProd.quantity -= findProd.quantity;

      return newProd;
    });

    await this.ormRepository.save(newProds);

    return newProds;
  }
}

export default ProductsRepository;
