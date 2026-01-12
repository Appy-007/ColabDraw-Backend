import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const allowedOrigin =
    process.env.MODE === 'PRODUCTION'
      ? process.env.FRONTEND_URL
      : 'http://localhost:5173';
  app.enableCors({
    origin: allowedOrigin, // 👈 SPECIFY YOUR REACT APP'S URL
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Allow cookies (important if you use HTTP-only cookies later)
  });
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
