import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CategoryType } from '../category/entities/category.enum';
import { FindAllCategoryParam } from '../category/param/find-all-category.param';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';

describe('ExpensesController', () => {
  let controller: ExpensesController;
  let mockService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    findByType: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    mockService = {
      create: jest.fn().mockReturnValue(of(undefined)),
      findAll: jest.fn().mockReturnValue(of(undefined)),
      findOne: jest.fn().mockReturnValue(of(undefined)),
      findByType: jest.fn().mockReturnValue(of(undefined)),
      update: jest.fn().mockReturnValue(of(undefined)),
      remove: jest.fn().mockReturnValue(of(undefined)),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExpensesController],
      providers: [
        {
          provide: ExpensesService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ExpensesController>(ExpensesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an expense', (done) => {
    expect.assertions(2);

    // given
    const dto: CreateExpenseDto = new CreateExpenseDto();
    dto.reason = 'Sondersachen';
    dto.expendedOn = new Date();
    dto.price = 1337.01;

    // when
    controller.create(dto).subscribe(() => {
      // then
      expect(mockService.create).toBeCalledTimes(1);
      expect(mockService.create).toBeCalledWith(dto);

      done();
    });
  });

  it('should find all expensese', (done) => {
    expect.assertions(1);

    // when
    controller.findAll(new FindAllCategoryParam()).subscribe(() => {
      expect(mockService.findAll).toBeCalledTimes(1);

      done();
    });
  });

  it('should find all expenses by type', (done) => {
    expect.assertions(2);

    // given
    const typeParam = new FindAllCategoryParam();
    typeParam.type = CategoryType.EXPENSE;

    // when
    controller.findAll(typeParam).subscribe(() => {
      expect(mockService.findByType).toBeCalledTimes(1);
      expect(mockService.findByType).toBeCalledWith(typeParam.type);

      done();
    });
  });

  it('should find one expense', (done) => {
    expect.assertions(2);

    // given
    const id = '10';

    // when
    controller.findOne(id).subscribe(() => {
      expect(mockService.findOne).toBeCalledTimes(1);
      expect(mockService.findOne).toBeCalledWith(+id);

      done();
    });
  });

  it('should update an expense', (done) => {
    expect.assertions(2);

    // given
    const id = '10';
    const updateDto: UpdateExpenseDto = new UpdateExpenseDto();
    updateDto.reason = 'Reason';
    updateDto.price = 123.12;
    updateDto.expendedOn = new Date();

    // when
    controller.update(id, updateDto).subscribe(() => {
      expect(mockService.update).toBeCalledTimes(1);
      expect(mockService.update).toBeCalledWith(+id, updateDto);

      done();
    });
  });

  it('should remove an expense', (done) => {
    expect.assertions(2);

    // given
    const id = '10';

    // when
    controller.remove(id).subscribe(() => {
      expect(mockService.remove).toBeCalledTimes(1);
      expect(mockService.remove).toBeCalledWith(+id);

      done();
    });
  });
});
