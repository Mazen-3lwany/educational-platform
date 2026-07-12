import { IsEmail, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class emailDto {
    @ApiProperty({ example: "mazen@example.com" })
    @IsEmail()
    @IsString()
    email: string
}