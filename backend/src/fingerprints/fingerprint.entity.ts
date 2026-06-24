import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from '../members/member.entity';

@Entity('fingerprints')
export class Fingerprint {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  fingerprintId!  : number;

  @Column()
  fingerName!: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ unique: true })
  memberId!: number;

  @ManyToOne(() => Member, (member) => member.fingerprints, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'memberId' })
  member!: Member;

  @CreateDateColumn()
  createdAt!: Date;
}