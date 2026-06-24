import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from '../members/member.entity';

@Entity('memberships')
export class Membership {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  memberId: number;

  @Column()
  type: string; // diaria, semanal, mensual, anual

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'date' })
  endDate: string;

  @Column({ default: 'activa' })
  status: string; // activa, vencida, cancelada

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @ManyToOne(() => Member, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'memberId' })
  member: Member;

  @CreateDateColumn()
  createdAt: Date;
}