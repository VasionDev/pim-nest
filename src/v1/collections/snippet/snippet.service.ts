import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SnippetCategoryDto, SnippetCreateDto, SnippetUpdateDto } from './dto';
import { Snippet, SnippetCategory } from './interface';

@Injectable()
export class SnippetService {
    constructor(
        @InjectModel('Snippet_Category') private snippetCategoryModel: Model<SnippetCategory>,
        @InjectModel('Snippet') private snippetModel: Model<Snippet>
    ) {}

    async getCategoryList(): Promise<SnippetCategory[]> {
        try {
            const snippetList = await this.snippetCategoryModel.find().sort({name: 1}).populate('snippets').exec()
            const returnData = snippetList.map(snippet=>({
                id: snippet.id,
                name: snippet.name,
                snippets: snippet.snippets.map((item: any) => ({
                    id: item.id,
                    name: item.name,
                    snippetId: item.snippetId,
                    category: item.category,
                    text: item.text,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                createdAt: snippet.createdAt,
                updatedAt: snippet.updatedAt
            }))
            return returnData as SnippetCategory[]
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async addCategory(data: SnippetCategoryDto): Promise<SnippetCategory> {
        try {
            const newCat = new this.snippetCategoryModel({
                ...data
            })
            const snippet = await newCat.save()
            const returnData = {
                id: snippet.id,
                name: snippet.name,
                snippets: snippet.snippets,
                createdAt: snippet.createdAt,
                updatedAt: snippet.updatedAt
            }
            return returnData as SnippetCategory
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async updateCategory(id: string, updateData: SnippetCategoryDto): Promise<SnippetCategory> {
        try {
            const snippet = await this.snippetCategoryModel.findByIdAndUpdate(id, {
                ...updateData
            }, {new: true}).exec()
            if(snippet != null) {
                const returnData = {
                    id: snippet.id,
                    name: snippet.name,
                    snippets: snippet.snippets,
                    createdAt: snippet.createdAt,
                    updatedAt: snippet.updatedAt
                }
                return returnData as SnippetCategory
            }
            throw new HttpException('Snippet category not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async deleteCategory(id: string): Promise<string> {
        try {
            const snippet = await this.snippetCategoryModel.findByIdAndDelete(id).exec()
            if(snippet != null) {
                return `${snippet.name} snippet category has been deleted successfully`
            }
            throw new HttpException('Snippet category not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }


    async getSnippetList(): Promise<Snippet[]> {
        try {
            const snippetList = await this.snippetModel.find().sort({name: 1}).exec()
            const returnData = snippetList.map(snippet=>({
                id: snippet.id,
                name: snippet.name,
                snippetId: snippet.snippetId,
                category: snippet.category,
                text: snippet.text,
                createdAt: snippet.createdAt,
                updatedAt: snippet.updatedAt
            }))
            return returnData as Snippet[]
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async addSnippet(data: SnippetCreateDto): Promise<Snippet> {
        try {
            const newSnippet = new this.snippetModel({
                ...data
            })
            const snippet = await newSnippet.save()
            await this.snippetCategoryModel.updateOne({'_id': data.category}, {$push: {snippets: snippet.id}})
            const returnData = {
                id: snippet.id,
                name: snippet.name,
                snippetId: snippet.snippetId,
                category: snippet.category,
                text: snippet.text,
                createdAt: snippet.createdAt,
                updatedAt: snippet.updatedAt
            }
            return returnData as Snippet
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async updateSnippet(id: string, updateData: SnippetUpdateDto): Promise<Snippet> {
        try {
            const item = await this.snippetModel.findById(id).exec()
            const prevCatId = item.category.toString()
            if(item != null) {
                const snippet = await this.snippetModel.findByIdAndUpdate(id, {
                    ...updateData
                }, {new: true}).exec()
                const newCatId = snippet.category.toString()
                if(prevCatId !== newCatId) {
                    await this.snippetCategoryModel.updateOne({'_id': prevCatId}, {$pull: {snippets: snippet.id}})
                    await this.snippetCategoryModel.updateOne({'_id': newCatId}, {$push: {snippets: snippet.id}})
                }
                const returnData = {
                    id: snippet.id,
                    name: snippet.name,
                    snippetId: snippet.snippetId,
                    category: snippet.category,
                    text: snippet.text,
                    createdAt: snippet.createdAt,
                    updatedAt: snippet.updatedAt
                }
                return returnData as Snippet
            }
            throw new HttpException('Snippet text not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async deleteSnippet(id: string): Promise<string> {
        try {
            const snippet = await this.snippetModel.findByIdAndDelete(id).exec()
            if(snippet != null) {
                await this.snippetCategoryModel.updateOne({'_id': snippet.category}, {$pull: {snippets: snippet.id}})
                return `${snippet.name} has been deleted successfully`
            }
            throw new HttpException('Snippet text not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }
    
}
