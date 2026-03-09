import { SetMetadata } from "@nestjs/common";
import { Roles } from "generated/prisma/enums.js";

export const ROLES_KEY = 'roles';
export const userRoles=(...roles:Roles[])=>SetMetadata(ROLES_KEY,roles)