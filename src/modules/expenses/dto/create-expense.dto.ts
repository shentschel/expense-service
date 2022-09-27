import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsDecimal,
  IsDefined,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExpenseDto {
  @ApiProperty()
  @IsDefined()
  @IsDecimal()
  price: number;

  @ApiProperty()
  @IsDefined()
  @IsString()
  reason: string;

  @ApiProperty()
  @IsDefined()
  @IsDate()
  expendedOn: Date;

  @ApiProperty()
  @IsOptional()
  @IsInt()
  category?: number;
}
