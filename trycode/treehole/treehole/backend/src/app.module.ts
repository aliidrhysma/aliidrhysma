import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from './config/database.config';
import { redisConfig } from './config/redis.config';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CoordinateModule } from './modules/coordinate/coordinate.module';
import { MessageModule } from './modules/message/message.module';
import { ReplyModule } from './modules/reply/reply.module';
import { ReportModule } from './modules/report/report.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    AuthModule,
    UserModule,
    CoordinateModule,
    MessageModule,
    ReplyModule,
    ReportModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
