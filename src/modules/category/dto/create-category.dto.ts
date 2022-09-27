import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEnum, IsString } from 'class-validator';
import { CategoryType } from '../entities/category.enum';

export class CreateCategoryDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  name: string;

  @ApiProperty({ enum: CategoryType })
  @IsDefined()
  @IsEnum(CategoryType)
  type: CategoryType;
}
