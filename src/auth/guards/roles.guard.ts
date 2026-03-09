import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Roles } from "generated/prisma/enums.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector:Reflector){}
    canActivate(context: ExecutionContext):  boolean  {
        const requiredRoles=this.reflector.getAllAndOverride<Roles[]>(ROLES_KEY,
            [
            context.getClass(),
            context.getHandler(),
            ]
        )
        if(!requiredRoles){
            return true;
        }
        const {user}=context.switchToHttp().getRequest()
        return requiredRoles.some((role)=>user.role===role)
    }
}