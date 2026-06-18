import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum CoordinateStatus {
  FREE = 0,
  OCCUPIED = 1,
}

@Entity('coordinates')
export class Coordinate {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'coord_id', type: 'varchar', length: 20, unique: true })
  coordId: string;

  @Column({ name: 'user_id', type: 'varchar', length: 32, nullable: true })
  userId: string;

  @Column({ name: 'heat_score', type: 'int', default: 0 })
  heatScore: number;

  @Column({ type: 'tinyint', default: CoordinateStatus.FREE })
  status: CoordinateStatus;

  @Column({ name: 'occupied_at', type: 'datetime', nullable: true })
  occupiedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
