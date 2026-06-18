import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum UserStatus {
  NORMAL = 1,
  FROZEN = 2,
  BANNED = 3,
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'varchar', length: 32, unique: true })
  userId: string;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  password: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl: string;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'tinyint', default: UserStatus.NORMAL })
  status: UserStatus;

  @Column({ name: 'freeze_count', type: 'int', default: 0 })
  freezeCount: number;

  @Column({ name: 'freeze_until', type: 'datetime', nullable: true })
  freezeUntil: Date;

  @Column({ name: 'report_count', type: 'int', default: 0 })
  reportCount: number;

  @Column({ name: 'current_coord_id', type: 'varchar', length: 20, nullable: true })
  currentCoordId: string;

  @Column({ name: 'register_time', type: 'datetime' })
  registerTime: Date;

  @Column({ name: 'last_login_time', type: 'datetime', nullable: true })
  lastLoginTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
