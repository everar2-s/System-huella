import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { User } from '../auth/user.entity';
import { Fingerprint } from '../fingerprints/fingerprint.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  email!: string;

  @Column({ default: 'pendiente_huella' })
  status!: string;

  @Column({ type: 'date' })
  membershipStart!: string;

  @Column({ type: 'date' })
  membershipEnd!: string;

  @Column({ nullable: true })
  createdById!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @OneToMany(() => Fingerprint, (fingerprint) => fingerprint.member)
  fingerprints!: Fingerprint[];

  @CreateDateColumn()
  createdAt!: Date;
}