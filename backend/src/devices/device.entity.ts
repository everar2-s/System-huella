import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('devices')
export class Device {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  deviceId!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  location! : string;

  @Column({ default: 'activo' })
  status!: string;

  @Column()
  apiKey!: string;

  @CreateDateColumn()
  createdAt!: Date;
}