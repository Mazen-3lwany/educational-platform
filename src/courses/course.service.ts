import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
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
    ) { }
    /**
     * 
     * @param payload 
     * @param courseData 
     * @param file 
     * @description  create course and store it in DB
     * @returns course
     */
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

    public async getCourseById(courseId: string) {
        const course = await this.prisma.course.findFirst({
            where: {
                id: courseId,
                isDeleted: false
            }
        })
        if (!course) throw new NotFoundException('course not found')
        return course
    }

    public async getAllCourses(page: number, limit: number) {
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where: {
                    isDeleted: false,
                    // status: 'PUBLISHED'// if you want to show only published courses in the list
                },
                skip: (page - 1) * limit,
                take: limit
            }),
            this.prisma.course.count({
                where: {
                    isDeleted: false,
                    // status: 'PUBLISHED'
                }
            })
        ])
        return {
            data: courses,
            total,
            page,
            limit
        }
    }

    public async getCoursesByInstructor(instructorId: string) {
        const courses = await this.prisma.course.findMany({
            where: {
                instructorId: instructorId,
                // status: 'PUBLISHED',
                isDeleted: false
            }
        })
        if (courses.length === 0) return []
        return courses
    }
    public async getMyCourses(payload: PayloadType) {
        if (payload.role !== Roles.INSTRUCTOR) {
            throw new ForbiddenException('Not allowed')
        }
        const courses = await this.prisma.course.findMany({
            where: {
                instructorId: payload.id,
                isDeleted: false
            }
        })
        return courses
    }
}