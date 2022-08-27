import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommonService } from 'src/common/common.service';
import { CategoryCreateDto, CategoryUpdateDto } from './dto';
import { Category } from './interface';

@Injectable()
export class CategoryService {
    constructor(
        @InjectModel('Category') private categoryModel: Model<Category>,
        private readonly commonService: CommonService
    ) {}

    async addCategory(categoryData: CategoryCreateDto, parentId?: string, list=[]): Promise<Category[]> {
        try {
            const {subCategories, ...saveData} = categoryData
            const newCategory = new this.categoryModel({
                ...saveData,
                slug: this.commonService.getSlug(saveData.name),
                parent: parentId !== undefined ? parentId : null
            })
            const category = await newCategory.save()
            list.push({
                id: category.id,
                name: category.name,
                slug: category.slug,
                parent: category.parent,
                shortText: category.shortText,
                longText: category.longText,
                media: category.media,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt, 
            })
            if(subCategories !== undefined) {
                for await (const subCategory of subCategories) {
                    await this.addCategory(subCategory, category.id.toString(), list)
                }
            }
            return list as Category[]
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Category name already exist', HttpStatus.CONFLICT)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getCategoryList(): Promise<Category[]> {
        try {
            const categories = await this.categoryModel.find().sort({name:1}).exec()
            const returnData = categories.map(category=>({
                id: category.id,
                name: category.name,
                slug: category.slug,
                parent: category.parent,
                shortText: category.shortText,
                longText: category.longText,
                media: category.media,
                createdAt: category.createdAt,
                updatedAt: category.updatedAt,
            })) as Category[]
            return returnData
        }catch(error) {
            throw new HttpException('something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async getCategoryById(catId: string): Promise<Category> {
        try {
            const category = await this.categoryModel.findById(catId).exec()
            if(category != null) {
                const returnData = {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    parent: category.parent,
                    shortText: category.shortText,
                    longText: category.longText,
                    media: category.media,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt,
                }
                return returnData as Category
            }
            throw new HttpException('Category not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async updateCategory(catId: string, categoryData: CategoryUpdateDto) {
        try {
            const category = await this.categoryModel.findByIdAndUpdate(catId, {
                ...categoryData,
                slug: this.commonService.getSlug(categoryData.name),
            }, {new: true}).exec()
            if(category != null) {
                const returnData = {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    parent: category.parent,
                    shortText: category.shortText,
                    longText: category.longText,
                    media: category.media,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt,
                }
                return returnData as Category
            }
            throw new HttpException('Category not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async deleteCategory(catId: string): Promise<string> {
        try {
            const category = await this.categoryModel.findByIdAndDelete(catId).exec()
            if(category != null) {
                await this.categoryModel.updateMany({parent: category.id}, {$set: {parent: null}})
                return `${category.name} category has been deleted successfully`
            }
            throw new HttpException('Category not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            if(error.status == 404) {
                throw new HttpException('Not found', HttpStatus.NOT_FOUND)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }else {
                throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
            }
        }
    }

    async getCategoryOrNull(catId: string): Promise<Category> {
        try {
            const category = await this.categoryModel.findById(catId).exec()
            if(category != null) {
                const returnData = {
                    id: category.id,
                    name: category.name,
                    slug: category.slug,
                    parent: category.parent,
                    shortText: category.shortText,
                    longText: category.longText,
                    media: category.media,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt,
                }
                return returnData as Category
            }
            return null
        }catch(error) {
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}
