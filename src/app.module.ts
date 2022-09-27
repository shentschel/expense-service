import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryModule } from './modules/category/category.module';
import { Category } from './modules/category/entities/category.entity';
import { Expense } from './modules/expenses/entities/expense.entity';
import { ExpensesModule } from './modules/expenses/expenses.module';

@Module({
  imports: [
    ExpensesModule,
    CategoryModule,
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'income-expense.sqlite',
      entities: [Category, Expense],
      synchronize: true,
    }),
  ],
})
export class AppModule {}
