import { IsEmail, IsNotEmpty, IsString, Length, MinLength } from "class-validator"
import { ApiProperty } from "@nestjs/swagger";
export class registerDto {

    @ApiProperty({ example: "Mazen Elwany", minLength: 3, maxLength: 25 })
    @IsString()
    @IsNotEmpty()
    @Length(3, 25)
    name: string

    @ApiProperty({ example: "mazen@example.com" })
    @IsString()
    @IsEmail()
    email: string

    @ApiProperty({ example: "strongPassword123", minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string

}