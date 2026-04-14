import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator";

export class updateLessonDto{
    @IsString()
    @IsNotEmpty()
    @Length(6,20)
    @IsOptional()
    title?:string
    @IsString()
    @IsNotEmpty()
    @Length(20,100)
    @IsOptional()
    description?:string
}