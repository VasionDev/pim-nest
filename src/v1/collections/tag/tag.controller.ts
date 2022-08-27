import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TagDto } from './dto';
import { TagService } from './tag.service';

@ApiTags('tag')
@Controller()
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @Get()
    getTagList() {
        return this.tagService.getTagList()
    }

    @Post()
    addTag(@Body() tagData: TagDto) {
        return this.tagService.addTag(tagData)
    }

    @Get(':id') 
    getTagById(@Param('id') tagId: string) {
        return this.tagService.getTagById(tagId)
    }

    @Patch(':id')
    updateTag(@Param('id') tagId: string, @Body() tagData: TagDto) {
        return this.tagService.updateTag(tagId, tagData)
    }

    @Delete(':id')
    deleteTag(@Param('id') tagId: string) {
        return this.tagService.deleteTag(tagId)
    }
}
