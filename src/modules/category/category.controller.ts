import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { FindAllCategoryParam } from './param/find-all-category.param';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createCategoryDto: CreateCategoryDto): Observable<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  @Get()
  findAll(@Query() params: FindAllCategoryParam): Observable<Category[]> {
    if (params.type !== undefined) {
      return this.categoryService.findByType(params.type);
    }

    return this.categoryService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Observable<Category> {
    return this.categoryService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Observable<Category> {
    return this.categoryService.update(+id, updateCategoryDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string): Observable<undefined> {
    return this.categoryService.remove(+id);
  }
}
