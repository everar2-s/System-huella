import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Fingerprint } from '../fingerprints/fingerprint.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true, unique: true })
  phone: string;

 @Column({ nullable: true, unique: true })
  email: string;

  @Column({ default: 'pendiente_huella' })
  status: string;

  @Column({ type: 'date' })
  membershipStart: string;

  @Column({ type: 'date' })
  membershipEnd: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Fingerprint, (fingerprint) => fingerprint.member)
  fingerprints: Fingerprint[];
}