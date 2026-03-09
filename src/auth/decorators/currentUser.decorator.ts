import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { PayloadType } from "src/utils/types.js";

export const CurrentUser=createParamDecorator(
    (data,context:ExecutionContext)=>{
        const request=context.switchToHttp().getRequest()
        const payload:PayloadType=request.user
        return payload
    }
)