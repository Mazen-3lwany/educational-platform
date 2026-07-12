// createLesson.dto.ts
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class createLessonDto {
    @ApiProperty({ example: "Intro to Guards", minLength: 6, maxLength: 20 })
    @IsString()
    @IsNotEmpty()
    @Length(6, 20)
    title: string;

    @ApiProperty({ example: "Learn how NestJS Guards control route access.", minLength: 20, maxLength: 100 })
    @IsString()
    @IsNotEmpty()
    @Length(20, 100)
    description: string;

    @ApiPropertyOptional({
        type: "array",
        items: { type: "string", format: "binary" },
        description: "Lesson files (images, videos, PDFs, DOC - max 50MB each, up to 10 files)",
    })
    lessonFiles?: any[];
}