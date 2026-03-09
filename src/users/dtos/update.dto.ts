import { IsOptional, IsString, Length } from "class-validator";

export class updateUserDto {
    @IsString()
    @IsOptional()
    @Length(3)
    name:string

}