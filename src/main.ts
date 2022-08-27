import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // api documentation config
  const configDoc = new DocumentBuilder()
    .setTitle('Pruvit PIM API')
    .setDescription('The detail documentation for pruvit product infomation management API.')
    .setVersion('1.0.0')
    .build()
  
  const document = SwaggerModule.createDocument(app, configDoc)
  SwaggerModule.setup('api/doc/v1',
    app,
    document,
    {swaggerOptions:{ 
      defaultModelsExpandDepth: -1,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha'
    }
  })

  app.useGlobalPipes(new ValidationPipe({whitelist: true}))
  app.useGlobalFilters(new HttpExceptionFilter())
  await app.listen(5000);
}
bootstrap();
