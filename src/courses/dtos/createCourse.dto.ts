import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Length } from "class-validator";

export class createCourseDTO {
    @IsString()
    @IsNotEmpty()
    @Length(4, 50)
    @Transform(({ value }) => value?.trim())
    title: string
    @IsString()
    @IsNotEmpty()
    @Length(15, 500)
    @Transform(({ value }) => value?.trim())
    description: string

}