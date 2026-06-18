import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MessageStatus {
  PENDING = 0,   // 待审核
  APPROVED = 1,  // 已通过
  REJECTED = 2,  // 已拒绝
}

export enum ContentType {
  TEXT = 1,
  IMAGE = 2,
  VIDEO = 3,
}

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'msg_id', type: 'varchar', length: 32, unique: true })
  msgId: string;

  @Column({ name: 'sender_id', type: 'varchar', length: 32 })
  senderId: string;

  @Column({ name: 'receiver_id', type: 'varchar', length: 32 })
  receiverId: string;

  @Column({ name: 'coord_id', type: 'varchar', length: 20 })
  coordId: string;

  @Column({ name: 'content_type', type: 'tinyint' })
  contentType: ContentType;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ name: 'media_urls', type: 'json', nullable: true })
  mediaUrls: string[];

  @Column({ name: 'is_anonymous', type: 'tinyint', default: 1 })
  isAnonymous: number;

  @Column({ type: 'tinyint', default: MessageStatus.PENDING })
  status: MessageStatus;

  @Column({ name: 'reject_reason', type: 'varchar', length: 200, nullable: true })
  rejectReason: string;

  @Column({ name: 'is_read', type: 'tinyint', default: 0 })
  isRead: number;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt: Date;

  @Column({ name: 'expire_at', type: 'datetime' })
  expireAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
