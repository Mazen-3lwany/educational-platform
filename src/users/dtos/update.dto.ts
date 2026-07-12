import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, Length } from "class-validator";

export class updateMeDto {
    @ApiPropertyOptional({ example: "Mazen Elwany", minLength: 3 })
    @IsOptional()
    @IsString()
    @Length(3)
    name?: string;

    @ApiPropertyOptional({ example: "https://cdn.example.com/avatar.jpg", description: "Profile image URL" })
    @IsOptional()
    @IsString()
    profileImage?: string;
}