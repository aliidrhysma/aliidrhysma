import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { MessageModule } from '../message/message.module';
import { ReplyModule } from '../reply/reply.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => MessageModule),
    forwardRef(() => ReplyModule),
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
