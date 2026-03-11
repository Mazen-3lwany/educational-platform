import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { registerDto } from "./dtos/register.dto.js";
import bcrypt from "bcryptjs";
import { loginDto } from "./dtos/login.dto.js";
import { PayloadType, tokenType } from "../utils/types.js";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { MailService } from "../mail/mail.service.js";
import { UserService } from "../users/user.service.js";
import { ConfigService } from "@nestjs/config";


@Injectable()
export class AuthService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly maileService: MailService,
        private readonly userService: UserService,
        private readonly configService: ConfigService
    ) { }

    public async register(userData: registerDto) {
        const { email, password } = userData;
        const existingUser = await this.userService.findUserWithEmail(email)
        if (existingUser) throw new BadRequestException("You have Account with this Email")
        const hashedPassword = await this.hashPassword(password)
        const newUser = await this.userService.createUser(userData, hashedPassword)
        // generate Link
        const link = this.generateVerificationLink(newUser.id, newUser.verificationToken as string)
        console.log(link)
        // send mail 
        await this.maileService.verificationEmail(newUser.email, link)

        return {
            status: "success",
            message: "Please,check you mail Box and verifiy your email"
        }
    }
    public async login(loginData: loginDto) {
        const { email, password } = loginData
        // check if email or user is exist in DB
        const user = await this.userService.findUserWithEmail(email)
        if (!user) throw new UnauthorizedException("Invalid email or password")
        // check password is valid 
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) throw new UnauthorizedException("Invalid email or password")
        if (!user.isActive) {
            let verificationToken = user.verificationToken
            let verificationTokenExpires = user.verificationTokenExpires
            if (!user.verificationToken) {
                verificationToken = crypto.randomBytes(32).toString('hex')
                verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000)

            }
            if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
                verificationToken = crypto.randomBytes(32).toString('hex')
                verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
            }
            await this.userService.updateUserForVerifiyEmail(user.id, {
                verificationToken,
                verificationTokenExpires
            })
            const link = this.generateVerificationLink(user.id, user.verificationToken ?? "")
            await this.maileService.verificationEmail(user.email, link)
            throw new BadRequestException(
                "Your email is not verified. A verification link has been sent."
            );
        }

        // generate tokens
        const tokens = await this.generateTokens({ id: user.id, role: user.role })
        await this.userService.storeRefreshToken(user.id, tokens.refresh_Token)
        return {
            status: "success",
            access_token: tokens.access_token,
            refresh_Token: tokens.refresh_Token
        }
    }

    public async verifiyMail(userId: string, verificationToken: string) {
        const user = await this.userService.getCurrentUser(userId)
        if (!user.verificationToken) {
            throw new BadRequestException("Invalid verification link");
        }
        if (user.verificationToken !== verificationToken) {
            throw new BadRequestException("Invalid verification token");
        }
        if (user.verificationTokenExpires && user.verificationTokenExpires < new Date()) {
            throw new BadRequestException("Verification token expired");
        }
        await this.userService.updateUserForVerifiyEmail(user.id, {
            verificationToken: null,
            verificationTokenExpires: null,
            isActive: true
        })
        return { message: "Email verified successfully" };
    }

    public async refresh(refershToken: string) {
        let payload: PayloadType
        try {
            payload = await this.jwtService.verify(refershToken, {
                secret: this.configService.get("JWT_REFRESH_SECRET")
            })
        } catch {
            throw new ForbiddenException()
        }
        const tokens = await this.userService.findTokensForSpecificUser(payload.id)
        // check refresh toke in valid
        let validToken: tokenType = null
        for (const token of tokens) {
            const match = await bcrypt.compare(refershToken, token.token)
            if (match) {
                validToken = token
                break
            }
        }
        console.log(validToken)
        if (!validToken) {
            throw new ForbiddenException()
        }
        // delete old refresh token
        await this.userService.deleteRefreshToken(validToken.id)
        //generate new access and regresh tokens
        const newtokens = await this.generateTokens(payload)
        // store new refresh token in DB
        await this.userService.storeRefreshToken(payload.id, newtokens.refresh_Token)
        return newtokens
    }


    private async generateTokens(payload: PayloadType) {
        const access_token = await this.jwtService.signAsync(
            {id:payload.id,role:payload.role}
            , {
                secret: this.configService.get('JWT_SECRET'),
                expiresIn: '1m'
            }
        )
        const refresh_Token = await this.jwtService.signAsync(
            {id:payload.id,role:payload.role}   ,
            {
                secret: this.configService.get('JWT_REFRESH_SECRET'),
                expiresIn: '7d'
            }
        )
        const tokens = {
            access_token,
            refresh_Token
        }
        return tokens

    }
    private async hashPassword(password: string) {
        const salt = await bcrypt.genSalt(10)
        const hashPassword = await bcrypt.hash(password, salt)
        return hashPassword
    }
    private generateVerificationLink(userId: string, verificationToken: string) {
        const link = `http://localhost:3000/api/users/auth/verify-email/${userId}/${verificationToken}`
        return link
    }
}