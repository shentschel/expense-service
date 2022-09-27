import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryType } from './entities/category.enum';
import { FindAllCategoryParam } from './param/find-all-category.param';

describe('CategoryController', () => {
  let controller: CategoryController;
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
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<CategoryController>(CategoryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create a new category', (done) => {
    expect.assertions(2);

    // given
    const dto: CreateCategoryDto = new CreateCategoryDto();
    dto.name = 'Sondersachen';
    dto.type = CategoryType.EXPENSE;

    // when
    controller.create(dto).subscribe(() => {
      // then
      expect(mockService.create).toBeCalledTimes(1);
      expect(mockService.create).toBeCalledWith(dto);

      done();
    });
  });

  it('should find all categories', (done) => {
    expect.assertions(1);

    // when
    controller.findAll(new FindAllCategoryParam()).subscribe(() => {
      // then
      expect(mockService.findAll).toBeCalledTimes(1);

      done();
    });
  });

  it('should find all categories of a specific type', (done) => {
    expect.assertions(2);

    // given
    const findAllParam: FindAllCategoryParam = new FindAllCategoryParam();
    findAllParam.type = CategoryType.EXPENSE;

    // when
    controller.findAll(findAllParam).subscribe(() => {
      expect(mockService.findByType).toBeCalledTimes(1);
      expect(mockService.findByType).toBeCalledWith(findAllParam.type);

      done();
    });
  });

  it('should find one category', (done) => {
    expect.assertions(2);

    // given
    const id = '10';

    // when
    controller.findOne(id).subscribe(() => {
      // then
      expect(mockService.findOne).toBeCalledTimes(1);
      expect(mockService.findOne).toBeCalledWith(+id);

      done();
    });
  });

  it('should update one category', (done) => {
    expect.assertions(2);

    // given
    const id = '10';
    const dto: UpdateCategoryDto = new UpdateCategoryDto();
    dto.name = 'Sondersachen';
    dto.type = CategoryType.EXPENSE;

    // when
    controller.update(id, dto).subscribe(() => {
      // then
      expect(mockService.update).toBeCalledTimes(1);
      expect(mockService.update).toBeCalledWith(+id, dto);

      done();
    });
  });

  it('should remove a category', (done) => {
    expect.assertions(2);

    // given
    const id = '10';

    // when
    controller.remove(id).subscribe(() => {
      // then
      expect(mockService.remove).toBeCalledTimes(1);
      expect(mockService.remove).toBeCalledWith(+id);

      done();
    });
  });
});
