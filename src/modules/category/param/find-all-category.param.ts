import { IsEnum, IsOptional } from 'class-validator';
import { CategoryType } from '../entities/category.enum';

export class FindAllCategoryParam {
  @IsOptional()
  @IsEnum(CategoryType)
  type?: CategoryType;
}
