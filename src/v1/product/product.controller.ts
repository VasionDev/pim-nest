import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductDto } from './dto';
import { ProductService } from './product.service';

@ApiTags('product')
@Controller()
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Get()
    getProductList() {
        return this.productService.getProductList()
    }

    @Post()
    addProduct(@Body() productCreateDto: ProductDto) {
        return this.productService.addProduct(productCreateDto)
    }

    @Get(':id')
    getProductById(@Param('id') productId: string) {
        return this.productService.getProductById(productId)
    }

    @Patch(':id')
    updateProduct(@Param('id') productId: string, @Body() productUpdateDto: ProductDto) {
        return this.productService.updateProduct(productId, productUpdateDto)
    }

    @Delete(':id')
    deleteProduct(@Param('id') productId: string) {
        return this.productService.deleteProduct(productId)
    }
}
