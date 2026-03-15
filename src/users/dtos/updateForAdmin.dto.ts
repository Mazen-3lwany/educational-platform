import { IsEnum, IsOptional } from "class-validator";
import { Roles } from "../../../generated/prisma/enums.js";

export class updateForAdminDto {
    @IsOptional()
    @IsEnum(Roles)
    role?: Roles
    @IsOptional()
    isActive?: boolean

}