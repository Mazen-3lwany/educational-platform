import {IsNotEmpty, IsString, Length} from "class-validator"
import { ApiProperty } from "@nestjs/swagger";
export class changePasswordType{
    
    @ApiProperty({ example: "oldPass123", minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @Length(6)
    oldPass:string

    @ApiProperty({ example: "newPass123", minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @Length(6)
    newPass:string

    @ApiProperty({ example: "newPass123", minLength: 6 })
    @IsString()
    @IsNotEmpty()
    @Length(6)
    confirmPass:string
}