// updateLesson.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class updateLessonDto {
    @ApiPropertyOptional({ example: "Intro to Guards (Updated)", minLength: 6, maxLength: 20 })
    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    @IsOptional()
    title?: string;

    @ApiPropertyOptional({ example: "An updated description for the lesson.", minLength: 20, maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @Length(20, 100)
    @IsOptional()
    description?: string;
}