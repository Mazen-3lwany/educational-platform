import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { PayloadType } from "../utils/types.js";
import { createCourseDTO } from "./dtos/createCourse.dto.js";
import { UserService } from "../users/user.service.js";
import { FileUploadService } from "../uploads/upload.service.js";
import { Prisma, Roles } from "../../generated/prisma/client.js";
import { updateCourse } from "./dtos/updateCourse.dto.js";
import { UpdateCourseStatusDto } from "./dtos/updateCourseStatus.dto.js";
import { RedisService } from "../redis/redis.service.js";


@Injectable()
export class CourseService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly userService: UserService,
        private readonly uploadService: FileUploadService,
        private readonly Redis:RedisService
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
            // Delete the cached Course from Redis after create new course
            await this.Redis.deleteKeysByPattern('courses:page:*')
            // delete the cached courses by instructorId from Redis after create new course
            await this.Redis.del(`instructor-courses:${user.id}`)
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
        const cachedKey=`course:${courseId}`
        console.log('Fetching course from cache or database...')
        const cachedCourse=await this.Redis.get(cachedKey)
        if(cachedCourse){
            console.log('Cache Hit')
            return JSON.parse(cachedCourse)
        }
        console.log('Cache Miss')
        // 2. Get course from PostgreSQL (DB)
        const course = await this.prisma.course.findFirst({
            where: {
                id: courseId,
                isDeleted: false
            }
        })
        if (!course) throw new NotFoundException('course not found')
        
          // 3. Store course in Redis
        await this.Redis.set(cachedKey,JSON.stringify(course),300)//
        return course

    }

    public async getAllCourses(page: number, limit: number) {
        const cachedKey=`courses:page:${page}:limit:${limit}`
        const cachedCourses=await this.Redis.get(cachedKey)
        if(cachedCourses){
            console.log('Cache Hit')
            return JSON.parse(cachedCourses)
        }
        console.log('Cache Miss')
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

        const response ={
            data: courses,
            total,
            page,
            limit
        }

         // Store the result in Redis for 5 minutes (300 seconds)
        await this.Redis.set(cachedKey,JSON.stringify(response),300)


        return response;
    }

    public async getCoursesByInstructor(instructorId: string) {
        const cahcedKey=`instructor-courses:${instructorId}`
        const cachedCourses=await this.Redis.get(cahcedKey)
        if(cachedCourses){
            console.log('Cache Hit')
            return JSON.parse(cachedCourses)
        }
        console.log("Cache Miss")
        const courses = await this.prisma.course.findMany({
            where: {
                instructorId: instructorId,
                // status: 'PUBLISHED',
                isDeleted: false
            }
        })
        await this.Redis.set(cahcedKey,JSON.stringify(courses),500)
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
    public async updateCourse(courseId: string, payload: PayloadType, courseData?: updateCourse, file?: Express.Multer.File) {
        if (payload.role !== Roles.INSTRUCTOR) {
            throw new ForbiddenException('Not Allowed')
        }
        if (!file && !courseData) {
            throw new BadRequestException('No data provided to update');
        }
        const course = await this.getCourseById(courseId)
        //Ownership Check 
        if (course.instructorId !== payload.id) {
            throw new ForbiddenException('You can only update your own courses');
        }
        const data: any = {}
        if (file) {
            try {
                const result = await this.uploadService.uploadFile(file)
                data.bannerUrl = result.secure_url
                data.publicBannerId = result.public_id
                try {
                    await this.uploadService.deleteFile(course.publicBannerId! as string)
                } catch (err) {
                    console.error('Failed to delete old banner', err)
                }
            } catch {
                throw new InternalServerErrorException('uploaded failed')
            }
        }
        if (courseData) {
            if (courseData.title !== undefined) {
                data.title = courseData.title;
            }
            if (courseData.description !== undefined) {
                data.description = courseData.description;
            }
        }
        const updateCourse = await this.prisma.course.update({
            where: { id: courseId },
            data
        })
        // Delete the cached Course from Redis after update
        const cachedKey = `course:${courseId}`
        console.log('Deleting course cache:', cachedKey);
        await this.Redis.del(cachedKey)
        console.log('Deleting pagination cache');
        await this.Redis.deleteKeysByPattern('courses:page:*')
        console.log('Deleting instructor cache:', `instructor-courses:${payload.id}`);
        await this.Redis.del(`instructor-courses:${payload.id}`)
        return updateCourse
    }

    public async updateCourseStatus(courseId: string, payload: PayloadType, courseStatus: UpdateCourseStatusDto) {
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException('Not Allowed')
        const course = await this.getCourseById(courseId)
        if (payload.id !== course.instructorId)
            throw new ForbiddenException('You are not allowed to update this course')
        if (course.status === courseStatus.status) {
            throw new BadRequestException('Course already in this status');
        }
        const updatedCourse = await this.prisma.course.update({
            where: {
                id: courseId
            },
            data: {
                status: courseStatus.status
            }
        })
        // Delete the cached Course from Redis after update
        await this.Redis.del(`course:${courseId}`)
        await this.Redis.deleteKeysByPattern('courses:page:*')
        await this.Redis.del(`instructor-courses:${payload.id}`)
        return updatedCourse
    }
    public async deleteCourse(courseId: string, payload: PayloadType) {
        if (payload.role !== Roles.INSTRUCTOR)
            throw new ForbiddenException('Not allowed')
        const course = await this.getCourseById(courseId)
        if (payload.id !== course.instructorId)
            throw new ForbiddenException("You are not allowed to Remove this course")
        if (course.isDeleted) {
            throw new BadRequestException('Course already deleted');
        }
        const deletedCourse  = await this.prisma.course.update({
            where: {
                id: courseId,
                isDeleted:false
            }, data: {
                isDeleted: true,
                deletedAt: new Date()
            }
        })
        // Delete the cached Course from Redis after delete
        await this.Redis.del(`course:${courseId}`)
        // Delete the cached Course list from Redis after delete
        await this.Redis.deleteKeysByPattern('courses:page:*')
        await this.Redis.del(`instructor-courses:${payload.id}`)
        return deletedCourse 
    }
    public async restoreCourse(courseId:string,payload:PayloadType){
        if(payload.role!==Roles.INSTRUCTOR)
            throw new ForbiddenException('Not Allowed')
        const course=await this.prisma.course.findUnique({
            where:{id:courseId}
        })
        if(!course)
            throw new NotFoundException('course not found')
        if(!course.isDeleted)
            throw new BadRequestException('Course is already active')
        if(payload.id!==course.instructorId)
            throw new ForbiddenException('You are not allowed to restore this course')
        const restoreCourse=await this.prisma.course.update({
            where:{id:courseId},
            data:{
                isDeleted:false
            }
        })
        await this.Redis.del(`course:${courseId}`)
        await this.Redis.deleteKeysByPattern('courses:page:*')
        await this.Redis.del(`instructor-courses:${payload.id}`)
        return restoreCourse
    }
}