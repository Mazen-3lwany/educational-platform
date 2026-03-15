import { IsOptional, IsString, Length } from "class-validator";

export class updateMeDto {
    @IsOptional()
    @IsString()
    @Length(3)
    name?: string

    @IsOptional()
    @IsString()
    profileImage?: string


}