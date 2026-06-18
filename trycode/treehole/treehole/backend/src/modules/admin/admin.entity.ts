import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum AdminStatus {
  NORMAL = 1,
  DISABLED = 2,
}

export enum AdminRole {
  NORMAL = 1,
  SUPER = 2,
}

@Entity('admins')
export class Admin {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'admin_id', type: 'varchar', length: 32, unique: true })
  adminId: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 200 })
  password: string;

  @Column({ type: 'tinyint', default: AdminRole.NORMAL })
  role: AdminRole;

  @Column({ type: 'tinyint', default: AdminStatus.NORMAL })
  status: AdminStatus;

  @Column({ name: 'last_login_time', type: 'datetime', nullable: true })
  lastLoginTime: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
