import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { attributeSchema } from '../schema';
import { ChoiceController } from './choice.controller';
import { ChoiceService } from './choice.service';
import { choiceSchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: 'Attribute', schema: attributeSchema},
      {name: 'Choice', schema: choiceSchema}
    ]),
  ],
  controllers: [ChoiceController],
  providers: [ChoiceService],
})
export class ChoiceModule {}
