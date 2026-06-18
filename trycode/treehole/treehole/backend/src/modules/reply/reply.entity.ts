import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { MessageStatus, ContentType } from '../message/message.entity';

@Entity('replies')
export class Reply {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'reply_id', type: 'varchar', length: 32, unique: true })
  replyId: string;

  @Column({ name: 'msg_id', type: 'varchar', length: 32 })
  msgId: string;

  @Column({ name: 'sender_id', type: 'varchar', length: 32 })
  senderId: string;

  @Column({ name: 'receiver_id', type: 'varchar', length: 32 })
  receiverId: string;

  @Column({ name: 'content_type', type: 'tinyint' })
  contentType: ContentType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'media_urls', type: 'json', nullable: true })
  mediaUrls: string[];

  @Column({ type: 'tinyint', default: MessageStatus.PENDING })
  status: MessageStatus;

  @Column({ name: 'reject_reason', type: 'varchar', length: 200, nullable: true })
  rejectReason: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
