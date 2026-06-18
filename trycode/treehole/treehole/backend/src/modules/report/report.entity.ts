import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ReportStatus {
  PENDING = 0,   // 待处理
  HANDLED = 1,   // 已处理
}

export enum TargetType {
  MESSAGE = 1,
  REPLY = 2,
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'report_id', type: 'varchar', length: 32, unique: true })
  reportId: string;

  @Column({ name: 'reporter_id', type: 'varchar', length: 32 })
  reporterId: string;

  @Column({ name: 'reported_user_id', type: 'varchar', length: 32 })
  reportedUserId: string;

  @Column({ name: 'target_type', type: 'tinyint' })
  targetType: TargetType;

  @Column({ name: 'target_id', type: 'varchar', length: 32 })
  targetId: string;

  @Column({ type: 'varchar', length: 500 })
  reason: string;

  @Column({ type: 'tinyint', default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ name: 'handle_result', type: 'varchar', length: 200, nullable: true })
  handleResult: string;

  @Column({ name: 'handled_at', type: 'datetime', nullable: true })
  handledAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
