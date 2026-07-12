import { ApiProperty } from "@nestjs/swagger";
import { Type } from 'class-transformer';
import { IsInt, Min, Max } from 'class-validator';

export class PaginationDto {
    @ApiProperty({ example: 1, minimum: 1 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number;

    @ApiProperty({ example: 10, minimum: 1, maximum: 50 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(50)
    limit: number;
}