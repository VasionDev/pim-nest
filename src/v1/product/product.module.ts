import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { reviewSchema } from '../collections/review/schema';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { productSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: 'Product', schema: productSchema},
      {name: 'Review', schema: reviewSchema}
    ])
  ],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
