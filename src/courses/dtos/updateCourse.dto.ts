import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class updateCourse {
    @ApiPropertyOptional({ example: "Intro to NestJS (Updated)", minLength: 5, maxLength: 25 })
    @IsString()
    @IsNotEmpty()
    @Length(5, 25)
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: "An updated description for the course.", minLength: 15, maxLength: 500 })
    @IsString()
    @IsNotEmpty()
    @Length(15, 500)
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ type: "string", format: "binary", description: "Course banner image (jpg, jpeg, png, webp - max 5MB)" })
    banner?: any;
}