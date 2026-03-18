import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) { }
    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();// convert this to Http mode and get request
        const token = this.extractTokenfromHeaders(request) // pass request to custom method that seperate tokens
        if (!token)
            throw new UnauthorizedException()
        try {
            const paload = await this.jwtService.verifyAsync(token)
            request['user'] = paload;
        } catch (error) {
            console.log(error)
            throw new UnauthorizedException()
        }
        return true;
    }


    private extractTokenfromHeaders(request: Request): string | undefined {
        const [type, token] = request.headers.authorization?.split(" ") ?? [];
        return type === 'Bearer' ? token : undefined
    }
}