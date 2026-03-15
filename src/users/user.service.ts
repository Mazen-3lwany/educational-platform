import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { registerDto } from "src/auth/dtos/register.dto.js";
import * as crypto from "crypto";
import { User } from "generated/prisma/client.js";
import bcrypt from "bcryptjs";
import { ResetPassword } from "../utils/types.js";
import { Prisma } from "generated/prisma/client.js";

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService) { }
    /**
     * @desc Get User With id
     */
    public async findUserById(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        })
        if (!user) throw new NotFoundException("User not Found")
        return user

    }
    /**
     *  @desc get user Profile
     * @param userId  id for current user that log in
     * @returns object of { name, email, isActive, role ,profileImage}
     */
    public async getCurrentUserProfile(userId: string) {
        const user = await this.findUserById(userId)
        const { name, email, isActive, role, profileImage } = user
        return {
            status: "success",
            data: { name, email, isActive, role, profileImage }
        }
    }


    /**
     * @desc Get All users in the system
     */
    public async getAllUsers(page?: number, limit?: number) {
        const pageNumber = page || 1;
        const pageLimit = limit || 10;
        const skip = (pageNumber - 1) * pageLimit
        const [users, totalUsers] = await Promise.all([
            this.prisma.user.findMany(
                {
                    where: { isDeleted: false },
                    skip: skip,
                    take: pageLimit,
                    orderBy: {
                        createdAt: "desc"
                    },
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true,
                        isActive: true,
                        createdAt: true
                    }
                }
            ),
            this.prisma.user.count({
                where:{isDeleted:false} // for count only users not deleted 
            })
        ])


        return {
            status: "success",
            data: users,
            meta: {
                total: totalUsers,
                page: pageNumber,
                lastPage: Math.ceil(totalUsers / pageLimit)
            }
        }
    }
    /**
     * 
     * @param id 
     * @param updatedata from type Prisma.UserUpsateInput
     * @returns 
     */
    //method update in primsa in user not found throw error 
    public async updateUser(id: string, updatedata: Prisma.UserUpdateInput) {
        try {
            const updatedUser = await this.prisma.user.update({
                where: { id },
                data: {
                    ...updatedata
                }
            })

            return updatedUser
        } catch {
            throw new NotFoundException("User not found")
        }
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
    public async storeRefreshToken(userId: string, refreshToken: string) {
        const hashedToken = await bcrypt.hash(refreshToken, 10)
        await this.prisma.refreshToken.create({
            data: {
                userId,
                token: hashedToken,
                expireAt: new Date(Date.now() + 60 * 60 * 1000 * 24 * 7)
            }
        })

    }
    public async findTokensForSpecificUser(userId: string) {
        const tokens = await this.prisma.refreshToken.findMany({
            where: { userId }
        })
        return tokens
    }
    public async deleteRefreshToken(id: string) {
        await this.prisma.refreshToken.delete({
            where: { id }
        })
    }

    public async deleteRefreshTokensforSpecificUser(userId: string) {
        await this.prisma.refreshToken.deleteMany({ where: { userId } })
    }

    public async createRestPassword(userId: string, resetPasswordData: ResetPassword) {
        // delete old reset password token if exist for this user
        await this.prisma.passwordResetToken.deleteMany({ where: { userId } })

        await this.prisma.passwordResetToken.create(
            {
                data: {
                    userId,
                    token: resetPasswordData.hashedResetToken,
                    expireAt: resetPasswordData.expireAt
                }
            }
        )
    }
    public async getPasswordToken(token: string) {
        const resetToken = await this.prisma.passwordResetToken.findUnique({ where: { token } })
        if (!resetToken) {
            throw new NotFoundException('Ivalid reset password token')
        }
        return resetToken
    }

    public async deleteResetPassword(id: string) {
        await this.prisma.passwordResetToken.delete({ where: { id } })
    }

    public async updatePassword(userId: string, hashedPassword: string) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                password: hashedPassword
            }
        })
    }
    /**
     * @desc Hard Delete for user from DB
     * @param userId
     */
    public async deleteUser(userId: string) {
        try {
            await this.prisma.user.delete({
                where: { id: userId }
            })
            return {
                status: "success",
                message: "User Deleted successfully"
            }
        }
        catch {
            throw new NotFoundException("User not Found")
        }

    }
    /**
     * @desc Soft delete for user
     * 
     */
    public async softDeleteUser(userId: string) {
        try {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    isDeleted: true
                }
            })
            return {
                status: "success",
                message: "User deleted successfully"
            };
        } catch {
            throw new NotFoundException("user not found")
        }
    }
}