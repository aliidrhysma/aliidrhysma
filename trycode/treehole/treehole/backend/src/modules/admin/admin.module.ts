import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { Admin } from './admin.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { User } from '../user/user.entity';
import { Message } from '../message/message.entity';
import { Report } from '../report/report.entity';
import { AuthModule } from '../auth/auth.module';
import { jwtAdminConfig } from '../../config/jwt.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, Message, Report]),
    JwtModule.register({
      secret: jwtAdminConfig.secret,
      signOptions: { expiresIn: jwtAdminConfig.expiresIn },
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
