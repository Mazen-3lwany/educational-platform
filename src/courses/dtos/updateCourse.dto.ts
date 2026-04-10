import { IsNotEmpty, IsOptional, IsString, Length } from "class-validator"

export class updateCourse{
    @IsString()
    @IsNotEmpty()
    @Length(5,25)
    @IsOptional()
    title?:string
    @IsString()
    @IsNotEmpty()
    @Length(15,500)
    @IsOptional()
    description?:string
}