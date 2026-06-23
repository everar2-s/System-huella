import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from '../members/member.entity';

@Entity('attendance_logs')
export class AttendanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  memberId?: number;

  @Column({ nullable: true })
  fingerprintId?: number;

  @Column({ nullable: true })
  deviceId?: string;

  @Column()
  type: string;

  @Column({ default: false })
  accessGranted: boolean;

  @Column()
  message: string;

  @ManyToOne(() => Member, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @CreateDateColumn()
  createdAt: Date;
}