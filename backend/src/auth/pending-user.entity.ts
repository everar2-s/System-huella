// src/auth/pending-user.entity.ts

import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('pending_users')
export class PendingUser {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: 'admin' })
  role! : string;

  @Column()
  verificationToken!: string;

  @Column({ type: 'timestamp' })
  verificationExpires!  : Date;

  @CreateDateColumn()
  createdAt!: Date;
}