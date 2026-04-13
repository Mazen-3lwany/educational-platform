import { Roles } from "../../generated/prisma/enums.js"

export type PayloadType = {
    id: string
    role: Roles
}
export type tokenType = {
    id: string;
    createdAt: Date;
    token: string;
    userId: string;
    expireAt: Date;
} | null

export type ResetPassword = {
    token: string
    expireAt: Date
    hashedResetToken: string
}
export type UserType = {
    id: string,
    role: Roles,
    profileImage: string,
    email: string,
    isActive: true
}
export const ALLOWED_MIME_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/webp',

    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',

    // PDF
    'application/pdf',

    // DOC
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
