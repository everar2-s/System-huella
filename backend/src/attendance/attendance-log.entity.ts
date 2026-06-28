import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from '../members/member.entity';
import { User } from '../auth/user.entity';

@Entity('attendance_logs')
export class AttendanceLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  memberId?: number;

  @Column({ nullable: true })
  fingerprintId?: number;

  @Column({ nullable: true })
  deviceId?: string;

  @Column()
  type!: string;

  @Column({ default: false })
  accessGranted!: boolean;

  @Column()
  message!: string;

  @ManyToOne(() => Member, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'memberId' })
  member?: Member;

  @Column({ nullable: true })
  createdById!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}