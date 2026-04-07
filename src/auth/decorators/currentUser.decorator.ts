import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { PayloadType, UserType } from "../../utils/types.js";

export const CurrentUser=createParamDecorator(
    (data,context:ExecutionContext)=>{
        const request=context.switchToHttp().getRequest()
        const payload:PayloadType=request.user
        return payload
    }
)
export const CurrentOauthUser=createParamDecorator(
    (data,context:ExecutionContext)=>{
        const request=context.switchToHttp().getRequest()
        const user:UserType=request.user
        return user
    }
)