import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { registerDto } from "./dtos/register.dto.js";
import bcrypt from "bcryptjs";
import { loginDto } from "./dtos/login.dto.js";
import { PayloadType, tokenType } from "../utils/types.js";
import { JwtService } from "@nestjs/jwt";
import * as crypto from "crypto";
import { MailService } from "../mail/mail.service.js";
import { UserService } from "../users/user.service.js";
import { ConfigService } from "@nestjs/config";
import { changePasswordType } from "./dtos/changePassword.dto.js";
import { User } from "generated/prisma/client.js";
import { emailDto } from "./dtos/resendVerification.dto.js";
import { FileUploadService } from "../uploads/upload.service.js";


@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly maileService: MailService,
        private readonly userService: UserService,
        private readonly configService: ConfigService,
        private readonly fileUploadService: FileUploadService
    ) { }

    public async register(userData: registerDto, file?: Express.Multer.File) {
        const { email, password } = userData;
        let profileImageUrl: string | undefined;
        let public_Id:string|undefined;
        if (file) {
            const uploadResult = await this.fileUploadService.uploadFile(file);
            profileImageUrl = uploadResult.secure_url;
            public_Id=uploadResult.public_id;
        }

        const existingUser = await this.userService.findUserWithEmail(email)
        if (existingUser) throw new BadRequestException("You have Account with this Email")
        const hashedPassword = await this.hashPassword(password)
        const newUser = await this.userService.createUser(userData, hashedPassword,profileImageUrl,public_Id)
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
    ////////////////////////////////////////////////////////////////////////
    public async login(loginData: loginDto) {
        const { email, password } = loginData
        // check if email or user is exist in DB
        const user = await this.userService.findUserWithEmail(email)
        if (!user) throw new UnauthorizedException("Invalid email or password")
        if (user.isDeleted) throw new ForbiddenException("Account is deleted");
        // check password is valid 
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) throw new UnauthorizedException("Invalid email or password")
        if (!user.isActive) {
            return await this.checkVerificationToken(user)
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
    ///////////////////////////////////////////////////////////////////////////////////
    public async verifiyMail(userId: string, verificationToken: string) {
        const user = await this.userService.findUserById(userId)
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

    public async refresh(refreshToken: string) {

        const payload = await this.verifyRefreshToken(refreshToken)
        const tokens = await this.userService.findTokensForSpecificUser(payload.id)
        // check refresh toke in valid
        let validToken: tokenType = null
        for (const token of tokens) {
            const match = await bcrypt.compare(refreshToken, token.token)
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

    public async logout(refreshToken: string) {
        const payload = await this.verifyRefreshToken(refreshToken)// verifiy refresh token and extract payload data
        const tokens = await this.userService.findTokensForSpecificUser(payload.id)
        for (const token of tokens) {
            const match = await bcrypt.compare(refreshToken, token.token)
            if (match) {
                await this.userService.deleteRefreshToken(token.id)
                return {
                    message: `User Logout successfully `
                }
            }
        }
        throw new ForbiddenException('Invalid refresh Token')
    }

    public async forgotPassword(eamil: string) {
        const user = await this.userService.findUserWithEmail(eamil);
        if (user) {
            const resetTokenObj = this.generateRestPasswordToken()

            //store reset password token in DB

            await this.userService.createRestPassword(user?.id, resetTokenObj)
            // send mail 
            const link = this.genrateRestPassworLink(user.id, resetTokenObj.token)
            await this.maileService.resetPasswordEamil(user.email, link)
        }
        return {
            message: "If user Exist you have recieve a mail for reset password"
        }
    }
    public async resetPassword(resetPasswordToken: string, newPassword: string) {
        const hashedResetToken = crypto.createHash('sha256').update(resetPasswordToken).digest("hex")
        const resetToken = await this.userService.getPasswordToken(hashedResetToken)

        if (!resetToken) throw new BadRequestException("Ivalid ,Reset password token")
        if (resetToken.expireAt < new Date()) {
            throw new BadRequestException("Token expired")
        }

        const hashedPassword = await this.hashPassword(newPassword)
        await this.userService.updatePassword(resetToken.userId, hashedPassword)
        await this.userService.deleteResetPassword(resetToken.id)
        return {
            message: "Password update successfully"
        }
    }



    public async changePassword(payload: PayloadType, passwords: changePasswordType) {
        // get user form Db with user Id
        const user = await this.userService.findUserById(payload.id)
        //check if password that pass from request equal password that stored in DB with hashed
        const isValidPass = await bcrypt.compare(passwords.oldPass, user.password)
        if (!isValidPass) throw new BadRequestException("Invalid Password")
        if (passwords.newPass !== passwords.confirmPass) throw new BadRequestException("Passwords do not match")
        // hashed new password that sended in request
        const hashedPassword = await this.hashPassword(passwords.newPass)
        // store new hashed password in DB
        await this.userService.updatePassword(payload.id, hashedPassword)

        return {
            message: "Password changed successfully"
        }
    }

    public async resendVerificationEmail(email: emailDto) {
        const userEmail = email.email
        const user = await this.userService.findUserWithEmail(userEmail)
        if (!user) throw new NotFoundException('user not found')
        if (!user.isActive) {
            return await this.checkVerificationToken(user)
        }
        return {
            message: "If the email exists and is not verified, a verification link has been sent. "
        }
    }
    private async generateTokens(payload: PayloadType) {
        const access_token = await this.jwtService.signAsync(
            { id: payload.id, role: payload.role }

        )
        const refresh_Token = await this.jwtService.signAsync(
            { id: payload.id, role: payload.role },
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
    private async verifyRefreshToken(refreshToken: string) {
        let payload: PayloadType
        try {
            payload = await this.jwtService.verify(refreshToken, {
                secret: this.configService.get("JWT_REFRESH_SECRET")
            })
            return payload
        } catch {
            throw new ForbiddenException()
        }
    }
    private genrateRestPassworLink(userId: string, restPasswordToken: string) {
        const link = `http://localhost:3000/api/users/auth/reset-password/${restPasswordToken}`
        return link
    }
    private generateRestPasswordToken() {
        const restPasswordToken = crypto.randomBytes(32).toString('hex')
        const expireAt = new Date(Date.now() + 5 * 60 * 60 * 1000)
        const hashedResetToken = crypto
            .createHash('sha256')
            .update(restPasswordToken)
            .digest('hex')
        const restToken = {
            token: restPasswordToken,
            expireAt: expireAt,
            hashedResetToken: hashedResetToken
        }
        return restToken
    }
    private async checkVerificationToken(user: User) {

        let verificationToken = user.verificationToken
        let verificationTokenExpires = user.verificationTokenExpires
        if (
            !user.verificationToken ||
            (user.verificationTokenExpires && user.verificationTokenExpires < new Date())
        ) {
            verificationToken = crypto.randomBytes(32).toString('hex')
            verificationTokenExpires = new Date(Date.now() + 60 * 60 * 1000)
        }
        await this.userService.updateUserForVerifiyEmail(user.id, {
            verificationToken,
            verificationTokenExpires
        })
        const link = this.generateVerificationLink(user.id, user.verificationToken ?? "")
        await this.maileService.verificationEmail(user.email, link)
        return {
            message: "Your email is not verified. A verification link has been sent."
        }

    }
}