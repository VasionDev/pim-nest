import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MediaCategoryDto, MediaCreateDto, MediaUpdateDto } from './dto';
import { MediaService } from './media.service';

@ApiTags('media')
@Controller()
export class MediaController {
    constructor(private readonly mediaService: MediaService) {}

    @Get('category')
    getCategoryList() {
        return this.mediaService.getCategoryList()
    }

    @Post('category')
    addMediaCategory(@Body() mediaCatCreateDto: MediaCategoryDto) {
        return this.mediaService.addMediaCategory(mediaCatCreateDto)
    }

    @Patch('category/:id')
    editMediaCategory(@Param('id') mediaCatId: string, @Body() mediaCatUpdateDto: MediaCategoryDto) {
        return this.mediaService.editMediaCategory(mediaCatId, mediaCatUpdateDto)
    }

    @Delete('category/:id')
    deleteMediaCategory(@Param('id') mediaCatId: string) {
        return this.mediaService.deleteMediaCategory(mediaCatId)
    }

    @Get('input')
    getMediaList() {
        return this.mediaService.getMediaList()
    }

    @Post('input')
    addMedia(@Body() mediaCreateDto: MediaCreateDto) {
        return this.mediaService.addMedia(mediaCreateDto)
    }

    @Patch('input/:id')
    editMedia(@Param('id') mediaCatId: string, @Body() mediaUpdateDto: MediaUpdateDto) {
        return this.mediaService.editMedia(mediaCatId, mediaUpdateDto)
    }

    @Delete('input/:id')
    deleteMedia(@Param('id') mediaCatId: string) {
        return this.mediaService.deleteMedia(mediaCatId)
    }
}
