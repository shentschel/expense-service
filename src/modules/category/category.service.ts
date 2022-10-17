import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { from, map, Observable, switchMap, throwError } from 'rxjs';
import { Like, Repository } from 'typeorm';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { CategoryType } from './entities/category.enum';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   *
   * @param createCategoryDto
   */
  create(createCategoryDto: CreateCategoryDto): Observable<Category> {
    const cleanedIdentifier: string = createCategoryDto.name
      .trim()
      .toLowerCase();
    const identifier = `${cleanedIdentifier}_${createCategoryDto.type.toLowerCase()}`;

    return from(
      this.categoryRepository.findBy({
        name: Like(createCategoryDto.name.trim()),
        type: createCategoryDto.type,
      }),
    ).pipe(
      switchMap((categories: Category[]) => {
        const foundCategory = categories.find((category: Category) => {
          return category.identifier === identifier;
        });

        if (foundCategory !== undefined) {
          return throwError(
            () =>
              new ConflictException({
                message: `Category with name '${createCategoryDto.name}' and type '${createCategoryDto.type}' already exists.`,
              }),
          );
        }

        const newCategory = new Category();
        newCategory.name = createCategoryDto.name.trim();
        newCategory.type = createCategoryDto.type;
        newCategory.identifier = identifier;

        return from(this.categoryRepository.save(newCategory));
      }),
    );
  }

  findAll(): Observable<Category[]> {
    return from(this.categoryRepository.find({}));
  }

  findByType(type: CategoryType): Observable<Category[]> {
    return from(this.categoryRepository.findBy({ type }));
  }

  findOne(id: number): Observable<Category> {
    return from(this.categoryRepository.findOneBy({ id })).pipe(
      map((category: Category | null) => {
        if (category === null) {
          throw new NotFoundException({
            message: `Category with ID '${id}' was not found.`,
          });
        }

        return category;
      }),
    );
  }

  update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
  ): Observable<Category> {
    return this.findOne(id).pipe(
      switchMap((category: Category) => {
        const cleanedCategoryName = updateCategoryDto.name.trim().toLowerCase();

        category.name = updateCategoryDto.name.trim();
        category.type = updateCategoryDto.type;
        category.identifier = `${cleanedCategoryName}_${updateCategoryDto.type.toLowerCase()}`;

        return from(this.categoryRepository.update(id, category));
      }),
      switchMap(() => this.findOne(id)),
    );
  }

  remove(id: number): Observable<undefined> {
    return this.findOne(id).pipe(
      switchMap(() => from(this.categoryRepository.delete(id))),
      map(() => undefined),
    );
  }
}
