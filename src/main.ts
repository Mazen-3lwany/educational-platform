import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js'; 
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validation Pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist:true, // remove property that not found in Dto
    forbidNonWhitelisted:true, // reject addtional property tha tnot found in DTO class
    transform:true // convert JSON to class instance
  }))
  // rate limit 
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
