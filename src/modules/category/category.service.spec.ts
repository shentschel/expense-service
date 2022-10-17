import {
  ConflictException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { catchError, from, map, of, switchMap } from 'rxjs';
import { Like, Repository } from 'typeorm';
import { DeleteResult } from 'typeorm/query-builder/result/DeleteResult';
import { Expense } from '../expenses/entities/expense.entity';
import { CategoryModule } from './category.module';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { CategoryType } from './entities/category.enum';

describe('CategoryService', () => {
  describe('Unit Tests', () => {
    let service: CategoryService;

    let mockRepository: {
      findBy: jest.Mock;
      findOneBy: jest.Mock;
      find: jest.Mock;
      update: jest.Mock;
      save: jest.Mock;
      delete: jest.Mock;
    };

    let mockCategory: Category;

    let testDate: Date;

    beforeEach(async () => {
      testDate = new Date();

      mockCategory = new Category();
      mockCategory.id = 10;
      mockCategory.name = 'Sondersachen';
      mockCategory.type = CategoryType.EXPENSE;
      mockCategory.identifier = `${mockCategory.name
        .trim()
        .toLowerCase()}_${CategoryType.EXPENSE.toLowerCase()}`;

      mockRepository = {
        findBy: jest
          .fn()
          .mockReturnValue(new Promise((resolve) => resolve([mockCategory]))),
        find: jest.fn().mockReturnValue(
          new Promise((resolve) => {
            resolve([mockCategory]);
          }),
        ),
        findOneBy: jest.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            resolve(mockCategory);
          });
        }),
        save: jest.fn().mockImplementation((entity: Category) => {
          return new Promise((resolve) => {
            entity.updatedAt = testDate;

            resolve(entity);
          });
        }),
        update: jest.fn().mockImplementation((id, entity: Category) => {
          return new Promise((resolve) => {
            entity.updatedAt = testDate;

            resolve(entity);
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
          CategoryService,
          {
            provide: getRepositoryToken(Category),
            useValue: mockRepository,
          },
        ],
      }).compile();

      service = module.get<CategoryService>(CategoryService);
    });

    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should create a new Category', (done) => {
      expect.assertions(7);

      // given
      const dto = new CreateCategoryDto();
      dto.name = 'Test';
      dto.type = CategoryType.EXPENSE;

      const expectedEntity = new Category();
      expectedEntity.name = dto.name;
      expectedEntity.type = dto.type;
      expectedEntity.updatedAt = testDate;
      expectedEntity.identifier = `${dto.name
        .trim()
        .toLowerCase()}_${dto.type.toLowerCase()}`;

      mockRepository.findBy.mockReturnValue(
        new Promise((resolve) => resolve([])),
      );

      // when
      service.create(dto).subscribe((category: Category) => {
        expect(mockRepository.findBy).toBeCalledTimes(1);
        expect(mockRepository.findBy).toBeCalledWith({
          name: Like(dto.name),
          type: dto.type,
        });
        expect(mockRepository.save).toBeCalledTimes(1);
        expect(mockRepository.save).toBeCalledWith(expectedEntity);
        expect(category.name).toBe(dto.name);
        expect(category.type).toBe(dto.type);
        expect(dto).not.toHaveProperty('identifier');

        done();
      });
    });

    it('should fail to create a new category with same name as an existing one', (done) => {
      expect.assertions(4);

      // given
      const dto = new CreateCategoryDto();
      dto.name = 'Sondersachen';
      dto.type = CategoryType.EXPENSE;

      // when
      service
        .create(dto)
        .pipe(
          catchError((e: ConflictException) => {
            expect(mockRepository.findBy).toBeCalledTimes(1);
            expect(mockRepository.findBy).toBeCalledWith({
              name: Like(dto.name),
              type: dto.type,
            });
            expect(e.getStatus()).toBe(HttpStatus.CONFLICT);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Category with name '${dto.name}' and type '${dto.type}' already exists.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should get all categories', (done) => {
      expect.assertions(3);

      // when
      service.findAll().subscribe(([resultCategory]: Category[]) => {
        expect(mockRepository.find).toBeCalledTimes(1);
        expect(mockRepository.find).toBeCalledWith({});
        expect(resultCategory).toStrictEqual(mockCategory);

        done();
      });
    });

    it('should get all categories for a specific type', (done) => {
      expect.assertions(3);

      // when
      service
        .findByType(CategoryType.EXPENSE)
        .subscribe(([result]: Category[]) => {
          expect(mockRepository.findBy).toBeCalledTimes(1);
          expect(mockRepository.findBy).toBeCalledWith({
            type: CategoryType.EXPENSE,
          });
          expect(result).toStrictEqual(mockCategory);

          done();
        });
    });

    it('should get a specific category', (done) => {
      expect.assertions(3);

      // given
      const id = 10;

      // when
      service.findOne(id).subscribe((resultDto: Category) => {
        expect(mockRepository.findOneBy).toBeCalledTimes(1);
        expect(mockRepository.findOneBy).toBeCalledWith({
          id: id,
        });
        expect(resultDto).toStrictEqual(mockCategory);

        done();
      });
    });

    it('should fail to get a category', (done) => {
      expect.assertions(2);

      // given
      mockRepository.findOneBy.mockReturnValue(
        new Promise((resolve) => resolve(null)),
      );

      // when
      service
        .findOne(10)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Category with ID '10' was not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should update a category', (done) => {
      expect.assertions(6);

      // given
      const id = 2;

      const updateDto = new UpdateCategoryDto();
      updateDto.name = 'Test-Update';
      updateDto.type = CategoryType.INCOME;

      const expectedEntity = mockCategory;
      expectedEntity.name = updateDto.name;
      expectedEntity.type = updateDto.type;
      expectedEntity.identifier = updateDto.name.trim().toLowerCase();
      expectedEntity.updatedAt = testDate;

      // when
      service.update(id, updateDto).subscribe((result: Category) => {
        expect(mockRepository.findOneBy).toBeCalledTimes(2);
        expect(mockRepository.findOneBy).toBeCalledWith({ id });
        expect(mockRepository.findOneBy).toHaveBeenNthCalledWith(2, { id });
        expect(mockRepository.update).toBeCalledTimes(1);
        expect(mockRepository.update).toBeCalledWith(id, expectedEntity);
        expect(expectedEntity).toStrictEqual(result);

        done();
      });
    });

    it('should fail to update a non-existing category', (done) => {
      expect.assertions(2);

      // given
      const id = 2;
      const updateDto = new UpdateCategoryDto();

      mockRepository.findOneBy.mockReturnValue(
        new Promise((resolve) => resolve(null)),
      );

      // when
      service
        .update(id, updateDto)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Category with ID '2' was not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should remove a category', (done) => {
      expect.assertions(5);

      // given
      const id = 10;

      // when
      service.remove(id).subscribe((result: undefined) => {
        expect(result).toBeUndefined();
        expect(mockRepository.findOneBy).toBeCalledTimes(1);
        expect(mockRepository.findOneBy).toBeCalledWith({ id });
        expect(mockRepository.delete).toBeCalledTimes(1);
        expect(mockRepository.delete).toBeCalledWith(id);

        done();
      });
    });

    it('should fail to remove a non-existent category', (done) => {
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
              `Category with ID '10' was not found.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });
  });

  describe('Integration Tests', () => {
    let module: TestingModule;
    let service: CategoryService;
    let repository: Repository<Category>;

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
        ],
      }).compile();

      service = module.get<CategoryService>(CategoryService);
      repository = module.get<Repository<Category>>(
        getRepositoryToken(Category),
      );
    });

    afterEach((done) => {
      from(repository.delete({}))
        .pipe(switchMap(() => from(module.close())))
        .subscribe(() => done());
    });

    it('should create a category', (done) => {
      expect.assertions(6);

      // given
      const dto: CreateCategoryDto = new CreateCategoryDto();
      dto.name = 'Sondersachen';
      dto.type = CategoryType.EXPENSE;

      // when
      service
        .create(dto)
        .pipe(
          catchError((e: HttpException) => {
            console.log(e);

            return of(e);
          }),
          switchMap((result: Category) => {
            expect(result.type).toBe(dto.type);
            expect(result.name).toBe(dto.name);
            expect(result.createdAt).toBeDefined();
            expect(result.updatedAt).toBeDefined();

            return from(repository.findOneBy({ id: result.id }));
          }),
        )
        .subscribe((dbResult: Category | null) => {
          expect(dbResult).toBeInstanceOf(Category);
          expect(dbResult.identifier).toBe(
            `${dto.name.trim().toLowerCase()}_${dto.type.toLowerCase()}`,
          );

          done();
        });
    });

    it('should fail to create a category when one with the same identifier already exists', (done) => {
      expect.assertions(2);

      // given
      const dto: CreateCategoryDto = new CreateCategoryDto();
      dto.name = 'sondersachen';
      dto.type = CategoryType.EXPENSE;

      const existingEntity = new Category();
      existingEntity.name = 'Sondersachen';
      existingEntity.type = CategoryType.EXPENSE;
      existingEntity.identifier = `${existingEntity.name
        .trim()
        .toLowerCase()}_${existingEntity.type.toLowerCase()}`;

      from(repository.save(existingEntity))
        .pipe(
          // when
          switchMap(() => service.create(dto)),
          // then
          catchError((e: ConflictException) => {
            expect(e.getStatus()).toBe(HttpStatus.CONFLICT);
            expect((e.getResponse() as { message: string }).message).toBe(
              `Category with name '${dto.name}' and type '${dto.type}' already exists.`,
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should find all categories', (done) => {
      expect.assertions(3);

      // given
      const category1 = new Category();
      category1.type = CategoryType.EXPENSE;
      category1.name = 'Sondersachen';
      category1.identifier = category1.name.trim().toLowerCase();

      const category2 = new Category();
      category2.type = CategoryType.INCOME;
      category2.name = 'Einkommen';
      category2.identifier = category2.name.trim().toLowerCase();

      from(repository.save([category1, category2]))
        .pipe(
          // when
          switchMap(() => service.findAll()),
        )
        .subscribe((categories: Category[]) => {
          // then
          expect(categories).toHaveLength(2);
          expect(
            categories.some(
              (category: Category) => category.type === CategoryType.INCOME,
            ),
          ).toBeTruthy();
          expect(
            categories.some(
              (category: Category) => category.type === CategoryType.EXPENSE,
            ),
          ).toBeTruthy();

          done();
        });
    });

    it('should find an empty array without categories', (done) => {
      expect.assertions(2);

      // when
      service.findAll().subscribe((categories: Category[]) => {
        // then
        expect(categories).toHaveLength(0);
        expect(categories).not.toBe(null);

        done();
      });
    });

    it('should find all categories by type', (done) => {
      expect.assertions(3);

      // given
      const category1 = new Category();
      category1.type = CategoryType.EXPENSE;
      category1.name = 'Sondersachen';
      category1.identifier = category1.name.trim().toLowerCase();

      const category2 = new Category();
      category2.type = CategoryType.INCOME;
      category2.name = 'Einkommen';
      category2.identifier = category2.name.trim().toLowerCase();

      from(repository.save([category1, category2]))
        .pipe(
          // when
          switchMap(() => service.findByType(CategoryType.EXPENSE)),
        )
        .subscribe((categories: Category[]) => {
          // then
          expect(categories).toHaveLength(1);
          expect(
            categories.some(
              (category: Category) => category.type === CategoryType.INCOME,
            ),
          ).toBeFalsy();
          expect(
            categories.some(
              (category: Category) => category.type === CategoryType.EXPENSE,
            ),
          ).toBeTruthy();

          done();
        });
    });

    it('should find by type an empty array without categories', (done) => {
      expect.assertions(2);

      // when
      service
        .findByType(CategoryType.EXPENSE)
        .subscribe((categories: Category[]) => {
          // then
          expect(categories).toHaveLength(0);
          expect(categories).not.toBe(null);

          done();
        });
    });

    it('should find one expense with a given id', (done) => {
      expect.assertions(3);

      // given
      const category: Category = new Category();
      category.type = CategoryType.EXPENSE;
      category.name = 'Sondersachen';
      category.identifier = category.name.trim().toLowerCase();

      from(repository.save(category))
        .pipe(
          // when
          switchMap((savedCategory: Category) =>
            service.findOne(savedCategory.id),
          ),
        )
        .subscribe((resultCategoryDto: Category) => {
          // then
          expect(resultCategoryDto.id).toBeDefined();
          expect(resultCategoryDto.type).toBe(category.type);
          expect(resultCategoryDto.name).toBe(category.name);

          done();
        });
    });

    it('should fail to find a category with an unknown id', (done) => {
      expect.assertions(2);

      // given

      service
        .findOne(10)
        .pipe(
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);
            expect((e.getResponse() as { message: string }).message).toBe(
              "Category with ID '10' was not found.",
            );

            return of(e);
          }),
        )
        .subscribe(() => done());
    });

    it('should update a category', (done) => {
      expect.assertions(2);

      // given
      const updateCategoryDto: UpdateCategoryDto = new UpdateCategoryDto();
      updateCategoryDto.name = 'Expense';
      updateCategoryDto.type = CategoryType.EXPENSE;

      const category: Category = new Category();
      category.name = 'Sondersachen';
      category.type = CategoryType.EXPENSE;
      category.identifier = 'sondersachen';

      from(repository.save(category))
        .pipe(
          // when
          switchMap((savedCategory: Category) =>
            service.update(savedCategory.id, updateCategoryDto),
          ),
        )
        .subscribe((updatedCategory: Category) => {
          expect(updatedCategory.name).not.toBe(category.name);
          expect(updatedCategory.name).toBe(updatedCategory.name);

          done();
        });
    });

    it('should delete a category', (done) => {
      expect.assertions(1);

      // given
      const category: Category = new Category();
      category.name = 'Sondersachen';
      category.type = CategoryType.EXPENSE;
      category.identifier = 'sondersachen';

      from(repository.save(category))
        .pipe(
          // when
          switchMap((savedCategory: Category) => {
            return service
              .remove(savedCategory.id)
              .pipe(map(() => savedCategory.id));
          }),
          switchMap((id: number) => service.findOne(id)),
          catchError((e: NotFoundException) => {
            expect(e.getStatus()).toBe(HttpStatus.NOT_FOUND);

            return of(e);
          }),
        )
        .subscribe(() => done());
    });
  });
});
