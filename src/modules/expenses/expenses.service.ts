import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, map, Observable, switchMap } from 'rxjs';
import { Repository } from 'typeorm';
import { CategoryService } from '../category/category.service';
import { Category } from '../category/entities/category.entity';
import { CategoryType } from '../category/entities/category.enum';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectRepository(Expense)
    private readonly expenseRepository: Repository<Expense>,

    private readonly categoryService: CategoryService,
  ) {}

  create(createExpenseDto: CreateExpenseDto): Observable<Expense> {
    const entity = new Expense();
    entity.price = createExpenseDto.price;
    entity.reason = createExpenseDto.reason;
    entity.expendedOn = createExpenseDto.expendedOn;

    if (createExpenseDto.category !== undefined) {
      return this.categoryService.findOne(createExpenseDto.category).pipe(
        switchMap((category: Category) => {
          entity.category = category;

          return from(this.expenseRepository.save(entity));
        }),
      );
    }

    return from(this.expenseRepository.save(entity));
  }

  findAll(): Observable<Expense[]> {
    return from(this.expenseRepository.find());
  }

  findByType(type: CategoryType): Observable<Expense[]> {
    return from(
      this.expenseRepository.findBy({
        category: {
          type,
        },
      }),
    );
  }

  findOne(id: number): Observable<Expense> {
    return from(this.expenseRepository.findOneBy({ id: id })).pipe(
      map((expense: Expense | null) => {
        if (expense === null) {
          throw new NotFoundException({
            message: `Expense with id ${id} not found.`,
          });
        }

        return expense;
      }),
    );
  }

  update(id: number, updateExpenseDto: UpdateExpenseDto): Observable<Expense> {
    return this.findOne(id).pipe(
      switchMap((expense: Expense) => {
        expense.reason = updateExpenseDto.reason;
        expense.expendedOn = updateExpenseDto.expendedOn;
        expense.price = updateExpenseDto.price;

        if (updateExpenseDto.category !== undefined) {
          return this.categoryService.findOne(updateExpenseDto.category).pipe(
            switchMap((category: Category) => {
              expense.category = category;

              return from(this.expenseRepository.update(id, expense));
            }),
          );
        }

        return from(this.expenseRepository.update(id, expense));
      }),
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: number): Observable<undefined> {
    return this.findOne(id).pipe(
      switchMap(() => from(this.expenseRepository.delete(id))),
      map(() => undefined),
    );
  }
}
