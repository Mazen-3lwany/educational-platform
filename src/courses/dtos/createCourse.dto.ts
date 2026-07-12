import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class createCourseDTO {
    @ApiProperty({ example: "Intro to NestJS", minLength: 4, maxLength: 50 })
    @IsString()
    @IsNotEmpty()
    @Length(4, 50)
    @Transform(({ value }) => value?.trim())
    title: string;

    @ApiProperty({ example: "A complete guide to building REST APIs with NestJS.", minLength: 15, maxLength: 500 })
    @IsString()
    @IsNotEmpty()
    @Length(15, 500)
    @Transform(({ value }) => value?.trim())
    description: string;

    @ApiPropertyOptional({ type: "string", format: "binary", description: "Course banner image (jpg, jpeg, png, webp - max 5MB)" })
    banner?: any;
}