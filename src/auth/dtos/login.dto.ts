import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger";
export class loginDto{
    @ApiProperty({ example: "mazen@example.com" })
    @IsString()
    @IsEmail()
    email:string

    @ApiProperty({ example: "strongPassword123", minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password:string
}