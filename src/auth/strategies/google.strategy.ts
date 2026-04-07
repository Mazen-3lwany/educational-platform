import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from "../auth.service.js";


@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly configeService: ConfigService,
                private readonly authService:AuthService
    ) {
        super({
            clientID: configeService.get('GOOGLE_CLIENT_ID'),
            clientSecret: configeService.get('GOOGLE_CLIENT_SECRET'),
            callbackURL: configeService.get('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile']
        });
    }
    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
        const user = await this.authService.handleGoogleLogin(profile)
        done(null, user)
    }

}