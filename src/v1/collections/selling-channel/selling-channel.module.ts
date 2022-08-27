import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { sellingChannelSchema } from './schema';
import { SellingChannelController } from './selling-channel.controller';
import { SellingChannelService } from './selling-channel.service';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Selling_Channel', schema: sellingChannelSchema}])],
  controllers: [SellingChannelController],
  providers: [SellingChannelService]
})
export class SellingChannelModule {}
