import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { catchError, from, of, switchMap } from 'rxjs';
import { Repository } from 'typeorm';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { CategoryModule } from '../category/category.module';
import { CategoryService } from '../category/category.service';
import { Category } from '../category/entities/category.entity';
import { CategoryType } from '../category/entities/category.enum';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { Expense } from './entities/expense.entity';
import { ExpensesModule } from './expenses.module';
import { ExpensesService } from './expenses.service';

describe('ExpensesService', () => {
  describe('Unit Tests', () => {
    let service: ExpensesService;

    let mockCategoryService: {
      findOne: jest.Mock;
    };

    let mockRepository: {
      findOneBy: jest.Mock;
      find: jest.Mock;
      findBy: jest.Mock;
      update: jest.Mock;
      save: jest.Mock;
      delete: jest.Mock;
    };

    let mockCategory: Category;
    let mockExpense: Expense;
    let testDate: Date;

    beforeEach(async () => {
      testDate = new Date();

      mockCategory = new Category();
      mockCategory.id = 10;
      mockCategory.name = 'Sondersachen';
      mockCategory.type = CategoryType.EXPENSE;

      mockExpense = new Expense();
      mockExpense.id = 1;
      mockExpense.price = 10.0;
      mockExpense.reason = 'Test';
      mockExpense.expendedOn = testDate;
      mockExpense.category = mockCategory;

      mockCategoryService = {
        findOne: jest.fn().mockReturnValue(of(mockCategory)),
      };

      mockRepository = {
        find: jest
          .fn()
          .mockReturnValue(new Promise((resolve) => resolve([mockExpense]))),
        findBy: jest
          .fn()
          .mockReturnValue(new Promise((resolve) => resolve([mockExpense]))),
        findOneBy: jest
          .fn()
          .mockReturnValue(new Promise((resolve) => resolve(mockExpense))),
        save: jest.fn().mockImplementation((entity: Expense) => {
          return new Promise((resolve) => {
            const newEntity = Object.assign(new Expense(), entity);
            newEntity.updatedAt = new Date();

            resolve(newEntity);
          });
        }),
        update: jest.fn().mockImplementation((entity: Expense) => {
          return new Promise((resolve) => {
            const newEntity = Object.assign(new Expense(), entity);
            newEntity.updatedAt = new Date();

            resolve(newEntity);
          });
        }),
        delete: jest
          .fn()
          .mockReturnValue(
            new Promise((resolve) => resolve(new DeleteResult())),
          ),
      };

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          ExpensesService,
          {
            provide: CategoryService,
            useValue: mockCategoryService,
          },
          { provide: getRepositoryToken(Expense), useValue: mockRepository },
        ],
      }).compile();

      service = module.get<ExpensesService>(ExpensesService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create an expense', (done) => {
      expect.assertions(4);

      // given
      const testDate = new Date();
      const dto = new CreateExpenseDto();
      dto.price = 100.0;
      dto.reason = 'Test';
      dto.expendedOn = testDate;
      dto.category = 1;

      const expectedExpense = new Expense();
      expectedExpense.category = mockCategory;
      expectedExpense.price = dto.price;
      expectedExpense.reason = dto.reason;
      expectedExpense.expendedOn = dto.expendedOn;

      // when
      service.create(dto).subscribe(() => {
        // then
        expect(mockCategoryService.findOne).toBeCalledWith(dto.category);
        expect(mockCategoryService.findOne).toBeCalledTimes(1);
        expect(mockRepository.save).toBeCalledTimes(1);
        expect(mockRepository.save).toBeCalledWith(expectedExpense);

        done();
      });
    });

    it('should create an expense without a category', (done) => {
      expect.assertions(3);

      // given
      const testDate = new Date();
      const dto = new CreateExpenseDto();
      dto.price = 100.0;
      dto.reason = 'Test';
      dto.expendedOn = testDate;

      const expectedExpense = new Expense();
      expectedExpense.price = dto.price;
      expectedExpense.reason = dto.reason;
      expectedExpense.expendedOn = dto.expendedOn;

      // when
      service.create(dto).subscribe(() => {
        // then
        expect(mockCategoryService.findOne).toBeCalledTimes(0);
        expect(mockRepository.save).toBeCalledTimes(1);
        expect(mockRepository.save).toBeCalledWith(expectedExpense);

        done();
      });
    });

    it('should find all expenses', (done) => {
      expect.assertions(2);

      // when
      service.findAll().subscribe((entities: Expense[]) => {
        expect(entities).toHaveLength(1);
        expect(entities[0]).toBe(mockExpense);

        done();
      });
    });

    it('should find all expenses by type', (done) => {
      expect.assertions(2);

      // given
      const type: CategoryType = CategoryType.EXPENSE;

      // when
      service.findByType(type).subscribe(() => {
        expect(mockRepository.findBy).toBeCalledTimes(1);
        expect(mockRepository.findBy).toBeCalledWith({
          category: {
            type: type,
          },
        });

        done();
      });
    });

    it('should find one expense', (done) => {
      expect.assertions(3);

      // given
      const id = 10;

      // when
      service.findOne(10).subscribe((result: Expense) => {
        expect(mockRepository.findOneBy).toBeCalledTimes(1);
        expect(mockRepository.findOneBy).toBeCalledWith({ id: id });
        expect(result).toBe(mockExpense);

        done();
      });
    });

    it('should find no expense', (done) => {
      expect.assertions(2);

      // given
      const id = 10;
      mockRepository.findOneBy.mockReturnValue(
        new Promise((resolve) => resolve(null)),
      );

      // when
      service
        .findOne(id)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id ${id} not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should update expense with category', (done) => {
      expect.assertions(5);

      // given
      const id = 10;
      const testDate = new Date();
      const updateDto: UpdateExpenseDto = new UpdateExpenseDto();
      updateDto.price = -1337.1;
      updateDto.reason = 'Lorem';
      updateDto.category = 1;
      updateDto.expendedOn = testDate;

      const expectedEntity: Expense = new Expense();
      expectedEntity.id = mockExpense.id;
      expectedEntity.price = updateDto.price;
      expectedEntity.reason = updateDto.reason;
      expectedEntity.expendedOn = updateDto.expendedOn;
      expectedEntity.category = mockCategory;

      // when
      service.update(id, updateDto).subscribe(() => {
        expect(mockRepository.findOneBy).toBeCalledWith({ id });
        expect(mockCategoryService.findOne).toBeCalledTimes(1);
        expect(mockCategoryService.findOne).toBeCalledWith(updateDto.category);
        expect(mockRepository.update).toBeCalledTimes(1);
        expect(mockRepository.update).toBeCalledWith(id, expectedEntity);

        done();
      });
    });

    it('should update expense without category', (done) => {
      expect.assertions(4);

      // given
      const id = 10;
      const testDate = new Date();
      const updateDto: UpdateExpenseDto = new UpdateExpenseDto();
      updateDto.price = -1337.1;
      updateDto.reason = 'Lorem';
      updateDto.expendedOn = testDate;

      const expectedEntity: Expense = new Expense();
      expectedEntity.id = mockExpense.id;
      expectedEntity.price = updateDto.price;
      expectedEntity.reason = updateDto.reason;
      expectedEntity.expendedOn = updateDto.expendedOn;
      expectedEntity.category = mockCategory;

      // when
      service.update(id, updateDto).subscribe(() => {
        expect(mockRepository.findOneBy).toBeCalledWith({ id });
        expect(mockCategoryService.findOne).toBeCalledTimes(0);
        expect(mockRepository.update).toBeCalledTimes(1);
        expect(mockRepository.update).toBeCalledWith(id, expectedEntity);

        done();
      });
    });

    it('should fail to update non-existing entity', (done) => {
      expect.assertions(2);

      // given
      const id = 10;
      mockRepository.findOneBy.mockReturnValue(
        new Promise((resolve) => resolve(null)),
      );

      // when
      service
        .update(id, new UpdateExpenseDto())
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id ${id} not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should remove an expense', (done) => {
      expect.assertions(4);

      // given
      const id = 10;

      // when
      service.remove(id).subscribe(() => {
        expect(mockRepository.findOneBy).toBeCalledTimes(1);
        expect(mockRepository.findOneBy).toBeCalledWith({ id });
        expect(mockRepository.delete).toBeCalledTimes(1);
        expect(mockRepository.delete).toBeCalledWith(id);

        done();
      });
    });

    it('should fail to remove an non-existent expense', (done) => {
      expect.assertions(2);

      // given
      const id = 10;
      mockRepository.findOneBy.mockReturnValue(
        new Promise((resolve) => resolve(null)),
      );

      // when
      service
        .remove(id)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id ${id} not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });
  });

  describe('Integration Tests', () => {
    let module: TestingModule;
    let service: ExpensesService;
    let expenseRepository: Repository<Expense>;
    let categoryRepository: Repository<Category>;

    let expenseCategory: Category;
    let incomeCategory: Category;

    beforeEach(async () => {
      module = await Test.createTestingModule({
        imports: [
          TypeOrmModule.forRoot({
            type: 'sqlite',
            database: ':memory:',
            entities: [Category, Expense],
            synchronize: true,
            dropSchema: true,
          }),
          CategoryModule,
          ExpensesModule,
        ],
      }).compile();

      service = module.get<ExpensesService>(ExpensesService);
      expenseRepository = module.get<Repository<Expense>>(
        getRepositoryToken(Expense),
      );
      categoryRepository = module.get<Repository<Category>>(
        getRepositoryToken(Category),
      );

      expenseCategory = new Category();
      expenseCategory.name = 'Sondersachen';
      expenseCategory.type = CategoryType.EXPENSE;
      expenseCategory.identifier = expenseCategory.name.trim().toLowerCase();

      incomeCategory = new Category();
      incomeCategory.name = 'Einkommen';
      incomeCategory.type = CategoryType.INCOME;
      incomeCategory.identifier = incomeCategory.name.trim().toLowerCase();

      await categoryRepository.save([expenseCategory, incomeCategory]);
    });

    afterEach((done) => {
      from(expenseRepository.delete({}))
        .pipe(
          switchMap(() => from(categoryRepository.delete({}))),
          switchMap(() => from(module.close())),
        )
        .subscribe(() => done());
    });

    it('should create an expense', (done) => {
      expect.assertions(5);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;
      createDto.category = expenseCategory.id;

      // when
      service.create(createDto).subscribe((result: Expense) => {
        expect(result.id).toBeDefined();
        expect(result.price).toBe(createDto.price);
        expect(result.reason).toBe(createDto.reason);
        expect(result.expendedOn).toBe(createDto.expendedOn);
        expect(result.category).toStrictEqual(expenseCategory);

        done();
      });
    });

    it('should create an expense without a category', (done) => {
      expect.assertions(5);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;

      // when
      service.create(createDto).subscribe((result: Expense) => {
        expect(result.id).toBeDefined();
        expect(result.price).toBe(createDto.price);
        expect(result.reason).toBe(createDto.reason);
        expect(result.expendedOn).toBe(createDto.expendedOn);
        expect(result.category).toBeUndefined();

        done();
      });
    });

    it('should create 2 expenses with the same parameters without a category', (done) => {
      expect.assertions(3);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;

      // when
      service
        .create(createDto)
        .pipe(
          switchMap(() => service.create(createDto)),
          switchMap(() => service.findAll()),
        )
        .subscribe((result: Expense[]) => {
          expect(result).toHaveLength(2);
          expect(
            result.every((expense) => expense.reason === createDto.reason),
          ).toBeTruthy();
          expect(
            result.every((expense) => expense.price === createDto.price),
          ).toBeTruthy();
          /* Due to rounding in MySQL not the same in nanoseconds...
          expect(
            result.every((expense) => {
              console.log(expense.expendedOn, createDto.expendedOn);
              return (
                expense.expendedOn.getTime() === createDto.expendedOn.getTime()
              );
            }),
          ).toBeTruthy();*/

          done();
        });
    });

    it('should find all created expenses', (done) => {
      expect.assertions(4);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;
      createDto.category = expenseCategory.id;

      service
        .create(createDto)
        // when
        .pipe(switchMap(() => service.findAll()))
        .subscribe((result: Expense[]) => {
          expect(result).toHaveLength(1);
          expect(result[0].reason).toBe(createDto.reason);
          expect(result[0].price).toBe(createDto.price);
          expect(result[0].category).toStrictEqual(expenseCategory);

          done();
        });
    });

    it('should return empty array with no expenses', (done) => {
      expect.assertions(1);

      service.findAll().subscribe((result: Expense[]) => {
        expect(result).toHaveLength(0);

        done();
      });
    });

    it('should find all created expenses with type', (done) => {
      expect.assertions(4);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;
      createDto.category = expenseCategory.id;

      const createDto2: CreateExpenseDto = new CreateExpenseDto();
      createDto2.reason = 'Real';
      createDto2.price = -12.3;
      createDto2.expendedOn = testDate;
      createDto2.category = incomeCategory.id;

      const findByType: CategoryType = CategoryType.EXPENSE;

      service
        .create(createDto)
        .pipe(
          switchMap(() => service.create(createDto2)),
          // when
          switchMap(() => service.findByType(findByType)),
        )
        .subscribe((result: Expense[]) => {
          expect(result).toHaveLength(1);
          expect(result[0].reason).toBe(createDto.reason);
          expect(result[0].price).toBe(createDto.price);
          expect(result[0].category).toStrictEqual(expenseCategory);

          done();
        });
    });

    it('should return empty array with no expenses', (done) => {
      expect.assertions(1);

      service
        .findByType(CategoryType.EXPENSE)
        .subscribe((result: Expense[]) => {
          expect(result).toHaveLength(0);

          done();
        });
    });

    it('should find one expense', (done) => {
      expect.assertions(3);

      // given
      const testDate: Date = new Date();
      const createDto: CreateExpenseDto = new CreateExpenseDto();
      createDto.reason = 'Kaufland';
      createDto.price = -1337.3;
      createDto.expendedOn = testDate;
      createDto.category = expenseCategory.id;

      service
        .create(createDto)
        // when
        .pipe(
          switchMap((createdEntity: Expense) =>
            service.findOne(createdEntity.id),
          ),
        )
        .subscribe((result: Expense) => {
          expect(result.reason).toBe(createDto.reason);
          expect(result.price).toBe(createDto.price);
          expect(result.category).toStrictEqual(expenseCategory);

          done();
        });
    });

    it('should fail find one expense', (done) => {
      expect.assertions(2);

      service
        .findOne(10)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id 10 not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should update an expense with a category', (done) => {
      expect.assertions(3);

      // given
      const createExpense = new Expense();
      createExpense.price = 1337;
      createExpense.reason = 'Sondersachen';
      createExpense.expendedOn = new Date();

      const updateDto: UpdateExpenseDto = new UpdateExpenseDto();
      updateDto.reason = 'new Reason';
      updateDto.price = -1337;
      updateDto.expendedOn = createExpense.expendedOn;
      updateDto.category = expenseCategory.id;

      from(expenseRepository.save(createExpense))
        .pipe(
          switchMap((createdExpense: Expense) =>
            service.update(createdExpense.id, updateDto),
          ),
        )
        .subscribe((updatedExpense: Expense) => {
          expect(updatedExpense.reason).toBe(updateDto.reason);
          expect(updatedExpense.price).toBe(updateDto.price);
          expect(updatedExpense.category).toStrictEqual(expenseCategory);

          done();
        });
    });

    it('should update an expense without a category', (done) => {
      expect.assertions(2);

      // given
      const createExpense = new Expense();
      createExpense.price = 1337;
      createExpense.reason = 'Sondersachen';
      createExpense.expendedOn = new Date();

      const updateDto: UpdateExpenseDto = new UpdateExpenseDto();
      updateDto.reason = 'new Reason';
      updateDto.price = -1337;
      updateDto.expendedOn = createExpense.expendedOn;

      from(expenseRepository.save(createExpense))
        .pipe(
          switchMap((createdExpense: Expense) =>
            service.update(createdExpense.id, updateDto),
          ),
        )
        .subscribe((updatedExpense: Expense) => {
          expect(updatedExpense.reason).toBe(updateDto.reason);
          expect(updatedExpense.price).toBe(updateDto.price);

          done();
        });
    });

    it('should fail update a non existing expense', (done) => {
      expect.assertions(2);

      service
        .update(10, new UpdateExpenseDto())
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id 10 not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should remove an expense', (done) => {
      expect.assertions(1);

      // given
      const createExpense = new Expense();
      createExpense.price = 1337;
      createExpense.reason = 'Sondersachen';
      createExpense.expendedOn = new Date();

      from(expenseRepository.save(createExpense))
        .pipe(
          // when
          switchMap((createdExpense: Expense) =>
            service.remove(createdExpense.id),
          ),
          switchMap(() => service.findAll()),
        )
        .subscribe((expenses: Expense[]) => {
          expect(expenses).toHaveLength(0);

          done();
        });
    });

    it('should fail remove a non existing expense', (done) => {
      expect.assertions(2);

      service
        .remove(10)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Expense with id 10 not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });
  });
});
