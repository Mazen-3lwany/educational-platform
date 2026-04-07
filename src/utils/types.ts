import { Roles } from "../../generated/prisma/enums.js"

export type PayloadType={
    id:string
    role:Roles
}
export type tokenType= {
    id: string;
    createdAt: Date;
    token: string;
    userId: string;
    expireAt: Date;
}|null

export type ResetPassword={
    token:string
    expireAt:Date
    hashedResetToken:string
}
export type UserType={
    id:string,
    role:Roles,
    profileImage:string,
    email:string,
    isActive:true
}
