import { Type } from 'class-transformer';
import {  IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
    
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number;

    
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number;
}