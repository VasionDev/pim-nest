import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChoiceService } from './choice.service';
import { ChoiceDto, ChoiceUpdateDto } from './dto';

@ApiTags('choice')
@Controller()
export class ChoiceController {
    constructor(private readonly choiceService: ChoiceService) {}

    @Get()
    getChoiceList() {
        return this.choiceService.getChoiceList()
    }

    @Post()
    addChoice(@Body() choiceCreateDto: ChoiceDto) {
        return this.choiceService.addChoice(choiceCreateDto)
    }

    @Patch(':id')
    updateChoice(@Param('id') choiceId: string, @Body() choiceUpdateDto: ChoiceUpdateDto) {
        return this.choiceService.updateChoice(choiceId, choiceUpdateDto)
    }

    @Delete(':id')
    deleteChoice(@Param('id') choiceId: string) {
        return this.choiceService.deleteChoice(choiceId)
    }
}
