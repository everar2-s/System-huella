import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Member } from '../members/member.entity';
import { User } from '../auth/user.entity';

@Entity('fingerprints')
@Index(['createdById', 'fingerprintId'], { unique: true })
export class Fingerprint {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fingerprintId!: number;

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

  @Column({ nullable: true })
  createdById!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;
}