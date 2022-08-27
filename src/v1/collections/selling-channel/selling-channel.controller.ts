import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SellingChannelDto } from './dto';
import { SellingChannelService } from './selling-channel.service';

@ApiTags('selling-channel')
@Controller()
export class SellingChannelController {
    constructor(private readonly sellingChannelService: SellingChannelService) {}

    @Get()
    getSellingChannelList() {
        return this.sellingChannelService.getSellingChannelList()
    }

    @Post()
    addSellingChannel(@Body() sellingChannelCreateDto: SellingChannelDto) {
        return this.sellingChannelService.addSellingChannel(sellingChannelCreateDto)
    }

    @Get(':id')
    getSellingChannelById(@Param('id') channelId: string) {
        return this.sellingChannelService.getSellingChannelById(channelId)
    }

    @Patch(':id')
    updateSellingChannel(@Param('id') channelId: string, @Body() sellingChannelUpdateDto: SellingChannelDto) {
        return this.sellingChannelService.updateSellingChannel(channelId, sellingChannelUpdateDto)
    }

    @Delete(':id')
    deleteSellingChannel(@Param('id') channelId: string) {
        return this.sellingChannelService.deleteSellingChannel(channelId)
    }
}
