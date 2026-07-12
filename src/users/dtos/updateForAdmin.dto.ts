import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { Roles } from "../../../generated/prisma/enums.js";

export class updateForAdminDto {
    @ApiPropertyOptional({ enum: Roles, example: Object.values(Roles)[0] })
    @IsOptional()
    @IsEnum(Roles)
    role?: Roles;

    @ApiPropertyOptional({ example: true })
    @IsOptional()
    isActive?: boolean;
}