import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Expense } from '../../expenses/entities/expense.entity';
import { CategoryType } from './category.enum';

@Entity('category')
export class Category {
  @PrimaryGeneratedColumn({ name: 'category_id', type: 'integer' })
  id: number;

  @Column({
    name: 'name',
    type: 'varchar',
    length: 40,
    nullable: false,
    unique: true,
  })
  name: string;

  @Column({
    name: 'category_type',
    type: 'integer',
  })
  type: CategoryType;

  @Column({
    name: 'identifier',
    type: 'varchar',
    length: 40,
    nullable: false,
    unique: true,
  })
  identifier: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Expense, (expense) => expense.category)
  expenses: Expense[];
}
