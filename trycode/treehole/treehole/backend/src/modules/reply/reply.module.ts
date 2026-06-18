import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reply } from './reply.entity';
import { ReplyService } from './reply.service';
import { ReplyController } from './reply.controller';
import { UserModule } from '../user/user.module';
import { MessageModule } from '../message/message.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reply]),
    forwardRef(() => UserModule),
    forwardRef(() => MessageModule),
  ],
  controllers: [ReplyController],
  providers: [ReplyService],
  exports: [ReplyService],
})
export class ReplyModule {}
