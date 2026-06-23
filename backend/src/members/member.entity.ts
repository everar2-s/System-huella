import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fullName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 'pendiente_huella' })
  status: string;

  @Column({ type: 'date' })
  membershipStart: string;

  @Column({ type: 'date' })
  membershipEnd: string;

  @CreateDateColumn()
  createdAt: Date;
}