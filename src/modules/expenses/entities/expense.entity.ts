import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DecimalTransformer } from '../../../transformer/decimal.transformer';
import { Category } from '../../category/entities/category.entity';

@Entity('expense')
export class Expense {
  @PrimaryGeneratedColumn({ name: 'expense_id', type: 'integer' })
  id: number;

  @Column({
    name: 'price',
    type: 'decimal',
    scale: 2,
    precision: 10,
    nullable: false,
    transformer: new DecimalTransformer(),
  })
  price: number;

  @Column({
    name: 'date',
    type: 'datetime',
    nullable: false,
  })
  expendedOn: Date;

  @Column({ name: 'reason', type: 'text', nullable: false })
  reason: string;

  @ManyToOne(() => Category, (category) => category.expenses, {
    eager: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ foreignKeyConstraintName: 'FK_expense_category' })
  category?: Category;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
