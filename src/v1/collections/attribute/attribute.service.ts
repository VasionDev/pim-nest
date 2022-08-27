import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChoiceDto, ChoiceUpdateDto } from './choice/dto';
import { Choice } from './choice/interface';
import { AttributeDto, AttributeUpdateDto } from './dto';
import { Attribute } from './interface';

@Injectable()
export class AttributeService {
    constructor(
        @InjectModel('Attribute') private attributeModel: Model<Attribute>,
        @InjectModel('Choice') private choiceModel: Model<Choice>,
    ) {}

    async addAttribute(attrData: AttributeDto): Promise<Attribute> {
        try {
            const newAttribute = new this.attributeModel({
                ...attrData
            })
            const attr = await newAttribute.save()
            const returnData = {
                id: attr.id,
                name: attr.name,
                choices: attr.choices,
                createdAt: attr.createdAt,
                updatedAt: attr.updatedAt
            }
            return returnData as Attribute
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async getAttributeList(): Promise<Attribute[]> {
        try {
            const attributes = await this.attributeModel.find().sort({name:1}).populate('choices').exec()
            const returnData = attributes.map(attr=>({
                id: attr.id,
                name: attr.name,
                choices: attr.choices.map((choice: any)=> ({
                    id: choice.id,
                    name: choice.name,
                    suffix: choice.suffix
                })),
                createdAt: attr.createdAt,
                updatedAt: attr.updatedAt
            }))
            return returnData as Attribute[]
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async getAttributeById(attrId: string): Promise<Attribute> {
        try {
            const attr = await this.attributeModel.findById(attrId).populate('choices').exec()
            if(attr != null) {
                const returnData = {
                    id: attr.id,
                    name: attr.name,
                    choices: attr.choices.map((choice: any)=> ({
                        id: choice.id,
                        name: choice.name,
                        suffix: choice.suffix
                    })),
                    createdAt: attr.createdAt,
                    updatedAt: attr.updatedAt
                }
                return returnData as Attribute
            }
            throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }


    private async addChoice(choiceData: ChoiceDto): Promise<string> {
        try {
            const newChoice = new this.choiceModel({
                ...choiceData
            })
            const choice = await newChoice.save()
            return choice.id.toString()
        }catch(error) {
            if(error.code == '11000') {
                throw new HttpException('Choice name already exist', HttpStatus.CONFLICT)
            }
            throw new HttpException(error, error.status)
        }
    }

    private getUniqueChoices(newChoices: ChoiceUpdateDto[], attribute: Attribute) {
        const uniqueChoices = [...new Map(newChoices.map(choice => [choice.name, choice])).values()]
        const availableChoices = attribute.choices.map((choice: any) => choice.name)
        const matchedChoices = uniqueChoices.filter(choice => availableChoices.indexOf(choice.name) !== -1)
        if(matchedChoices.length) throw new HttpException('some choices already exists', HttpStatus.CONFLICT)
        return uniqueChoices
    }

    async updateAttribute(attrId: string, attrData: AttributeUpdateDto): Promise<Attribute> {
        try {
            const attribute = await this.attributeModel.findById(attrId).populate('choices').exec()
            const newChoices: string[] = []
            if(attribute != null) {
                const {choices, ...saveData} = attrData
                if(choices !== undefined) {
                    const uniqueChoices = this.getUniqueChoices(choices, attribute)
                    for await (const choice of uniqueChoices) {
                        const data = {...choice, attribute: attrId}
                        const choiceId = await this.addChoice(data)
                        newChoices.push(choiceId)
                    }
                }
                const choiceList = newChoices.length ? [...attribute.choices, ...newChoices] : [...attribute.choices]
                const attr = await this.attributeModel.findByIdAndUpdate(attrId, {
                    ...saveData,
                    choices: choiceList
                }, {new: true}).exec()
                const returnData = {
                    id: attr.id,
                    name: attr.name,
                    choices: attr.choices,
                    createdAt: attr.createdAt,
                    updatedAt: attr.updatedAt
                }
                return returnData as Attribute
            }
            throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }

    async deleteAttribute(attrId: string): Promise<string> {
        try {
            const attr = await this.attributeModel.findByIdAndDelete(attrId).exec()
            if(attr != null) {
                await this.choiceModel.deleteMany({attribute: attr.id})
                return `${attr.name} attribute has been deleted successfully`
            }
            throw new HttpException('Attribute not found', HttpStatus.NOT_FOUND)
        }catch(error) {
            throw new HttpException(error, error.status)
        }
    }
}
