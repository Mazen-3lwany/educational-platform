import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from "class-validator"

export class registerDto{
    @IsString()
    @IsNotEmpty()
    @Length(3,25)
    name:string
    @IsString()
    @IsEmail()
    email:string
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string
}