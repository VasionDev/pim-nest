import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { tagSchema } from './schema';
import { TagController } from './tag.controller';
import { TagService } from './tag.service';

@Module({
  imports: [MongooseModule.forFeature([{name: 'Tag', schema: tagSchema}])],
  controllers: [TagController],
  providers: [TagService]
})
export class TagModule {}
