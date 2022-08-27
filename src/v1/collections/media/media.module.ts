import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { mediaCategorySchema, mediaSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: 'Media_Category', schema: mediaCategorySchema},
      {name: 'Media', schema: mediaSchema}
    ])
  ],
  controllers: [MediaController],
  providers: [MediaService]
})
export class MediaModule {}
