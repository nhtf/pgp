import { NestFactory } from '@nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { Module } from '@nestjs/common';

@Controller()
class AppController {

  @Get()
  getHello(): string {
    return "Hello World";
  }
}

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
