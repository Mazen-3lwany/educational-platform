import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { PayloadType } from "../utils/types.js";
import { createCourseDTO } from "./dtos/createCourse.dto.js";
import { UserService } from "../users/user.service.js";
import { FileUploadService } from "../uploads/upload.service.js";
import { Prisma, Roles } from "../../generated/prisma/client.js";

@Injectable()
export class CourseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        private readonly uploadService: FileUploadService
    ) {}
    public async createCourse(payload: PayloadType, courseData: createCourseDTO, file?: Express.Multer.File) {
        const user = await this.userService.findUserById(payload.id)// I have inside this method check for user founded or not.
        if (user.role !== Roles.INSTRUCTOR) {
            throw new ForbiddenException("You are not allowed to create a course");
        } //we add check in service layer because this service can be call from different places not only controller

        let bannerUrl: string | undefined
        let publicbannerId: string | undefined
        if (file) {
            try {
                const uploadResult = await this.uploadService.uploadFile(file)
                bannerUrl = uploadResult.secure_url;
                publicbannerId = uploadResult.public_id
            } catch {
                throw new InternalServerErrorException("File upload failed")
            }
        }
        // add course to Database
        try {
            const course = await this.prisma.course.create({
                data: {
                    instructorId: user.id,
                    title: courseData.title,
                    description: courseData.description,
                    bannerUrl: bannerUrl,
                    publicBannerId: publicbannerId
                }
            })
            return course
        } catch (err) {
            // if there is an error we need to cleanup the uploaded file to avoid orphan files in cloudinary
            if (publicbannerId) {
                try {
                    await this.uploadService.deleteFile(publicbannerId)
                } catch {
                    throw new InternalServerErrorException("Failed to cleanup image")
                }
            }
            //handle unique constraint violation for course title
            if (err instanceof Prisma.PrismaClientKnownRequestError) {
                if (err.code === 'P2002') {
                    throw new BadRequestException('Course title already exists');
                }
            }
            throw err
        }
    }
}