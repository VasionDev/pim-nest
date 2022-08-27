import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attribute } from '../interface';
import { ChoiceDto, ChoiceUpdateDto } from './dto';
import { Choice } from './interface';

@Injectable()
export class ChoiceService {
    constructor(
        @InjectModel('Attribute') private attributeModel: Model<Attribute>,
        @InjectModel('Choice') private choiceModel: Model<Choice>,
    ) {}

    async getChoiceList(): Promise<Choice[]> {
        try {
            const choices = await this.choiceModel.find().sort({name:1}).exec()
            const returnData = choices.map(choice=>({
                id: choice.id,
                name: choice.name,
                attribute: choice.attribute,
                createdAt: choice.createdAt,
                updatedAt: choice.updatedAt
            }))
            return returnData as Choice[]
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async addChoice(choiceData: ChoiceDto): Promise<Choice> {
        try {
            const newChoice = new this.choiceModel({
                ...choiceData
            })
            const choice = await newChoice.save()
            await this.attributeModel.updateOne({'_id': choice.attribute}, {$push: {choices: choice.id}})
            const returnData = {
                id: choice.id,
                name: choice.name,
                attribute: choice.attribute,
                createdAt: choice.createdAt,
                updatedAt: choice.updatedAt
            }
            return returnData as Choice
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Choice name already exist', HttpStatus.CONFLICT)
            }else if(error.kind == 'ObjectId' || error.name == 'ValidationError') {
                throw new HttpException('Bad request', HttpStatus.BAD_REQUEST)
            }
            throw new HttpException('Something went wrong', HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }

    async updateChoice(choiceId: string, choiceData: ChoiceUpdateDto): Promise<Choice> {
        try {
            const choice = await this.choiceModel.findByIdAndUpdate(choiceId, {
                ...choiceData
            }, {new: true}).exec()
            if(choice != null) {
                const returnData = {
                    id: choice.id,
                    name: choice.name,
                    attribute: choice.attribute,
                    createdAt: choice.createdAt,
                    updatedAt: choice.updatedAt
                }
                return returnData as Choice
            }
            throw new HttpException('Choice not found', HttpStatus.NOT_FOUND)
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

    async deleteChoice(choiceId: string): Promise<string> {
        try {
            const choice = await this.choiceModel.findByIdAndDelete(choiceId).exec()
            if(choice != null) {
                await this.attributeModel.updateOne({'_id': choice.attribute}, {$pull: {choices: choice.id}})
                return `${choice.name} choice has been deleted successfully`
            }
            throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND)
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
}
