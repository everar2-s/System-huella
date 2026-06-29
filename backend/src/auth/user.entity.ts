import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ default: 'admin' })
  role!: string;

  @Column({ default: true })
  active!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @Column({ default: false })
emailVerified!: boolean;

@Column({ type: 'varchar', nullable: true, unique: true })
emailVerificationToken!: string | null;

@Column({ type: 'timestamp', nullable: true })
emailVerificationExpires!: Date | null;
}