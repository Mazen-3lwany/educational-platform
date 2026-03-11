import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { updateUserDto } from "./dtos/update.dto.js";
import { registerDto } from "src/auth/dtos/register.dto.js";
import * as crypto from "crypto";
import { User } from "generated/prisma/client.js";
import bcrypt from "bcryptjs";

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }
    /**
     * @desc Get User With id
     */
    public async getCurrentUser(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } })
        if (!user) throw new NotFoundException("User not Founded")
        return user
    }

    /**
     * @desc Get All users in the system
     */
    public async getAllUsers() {
        const users = await this.prisma.user.findMany()
        if (!users || users.length === 0)
            throw new BadRequestException("Not users Founded yet")
        return users
    }

    public async updateUser(id: string, updatedata: updateUserDto) {
        await this.getCurrentUser(id)
        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: {
                ...updatedata
            }
        })
        return updatedUser
    }
    async updateUserForVerifiyEmail(userId: string, data: Partial<User>) {
        return this.prisma.user.update({
            where: { id: userId },
            data
        });
    }

    /**
     * @desc Method for Search For user With thier email in DB
     */
    public async findUserWithEmail(email: string) {
        const user = await this.prisma.user.findUnique({ where: { email } })
        return user
    }

    public async createUser(userData: registerDto, hashedPassword: string) {
        const { name, email } = userData;
        const newUser = await this.prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                verificationToken: crypto.randomBytes(32).toString('hex'),
                verificationTokenExpires: new Date(Date.now() + 60 * 60 * 1000)
            }
        })
        return newUser
    }
    /**
     * 
     * @param userId //user id  to detect identity of user that has refresh token
     * @param refreshToken // value that we want to store in DB
     * @desc this method used to encrypt refreshToken and store it in DB
     */
    public async storeRefreshToken(userId:string,refreshToken:string){
        const hashedToken=await bcrypt.hash(refreshToken,10)
        await this.prisma.refreshToken.create({
            data:{
                userId,
                token:hashedToken,
                expireAt:new Date(Date.now()+60*60*1000*24*7)
            }
        })
        
    }
    public async findTokensForSpecificUser(userId:string){
        const tokens= await this.prisma.refreshToken.findMany({
            where:{userId}
        })
        return tokens
    }
    public async deleteRefreshToken(id:string){
        await this.prisma.refreshToken.delete({
            where:{id}
        })
    }
}