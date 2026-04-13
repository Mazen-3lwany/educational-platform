import { BadRequestException, Body, Controller, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { AuthGuard } from "../auth/guards/auth.guard.js";
import { RolesGuard } from "../auth/guards/roles.guard.js";
import { userRoles } from "../auth/decorators/roles.decorator.js";
import { FilesInterceptor } from "@nestjs/platform-express";
import { CurrentUser } from "../auth/decorators/currentUser.decorator.js";
import { ALLOWED_MIME_TYPES, type PayloadType } from "../utils/types.js";
import { createLessonDto } from "./dto/createLesson.dto.js";
import { LessonService } from "./lesson.service.js";

@Controller('api/lessons')
export class LessonController {
    constructor(private readonly lessonService: LessonService) { }
    @Post("/:courseId")
    @UseGuards(AuthGuard, RolesGuard)
    @userRoles('INSTRUCTOR')
    @UseInterceptors(FilesInterceptor('lessonFiles', 10, {

        limits: {
            fileSize: 50 * 1024 * 1024, // 50MB
        },
        fileFilter: (req, file, cb) => {
            if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
                return cb(
                    new BadRequestException(
                        'Only images, videos, PDFs, and DOC files are allowed'
                    ),
                    false,
                );
            }

            cb(null, true);
        },
    }))
    public async createLesson(
        @CurrentUser() payload: PayloadType,
        @Body() lessonData: createLessonDto,
        @Param('courseId') courseId: string,
        @UploadedFiles() files: Express.Multer.File[]
    ) {
        return this.lessonService.createLesson(courseId, payload, lessonData, files)
    }
}