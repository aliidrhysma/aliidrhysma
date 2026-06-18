import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 全局管道 - 参数验证
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // CORS配置
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization,X-Requested-With',
    credentials: true,
  });

  // 设置请求体大小限制
  app.use(bodyParser.json({ limit: '10mb' }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`=================================`);
  console.log(`树洞系统后端服务运行在: http://localhost:${port}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`=================================`);
}

bootstrap();
