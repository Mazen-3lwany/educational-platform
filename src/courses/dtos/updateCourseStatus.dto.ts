import { IsEnum } from 'class-validator';
import { CourseStatus } from '../../../generated/prisma/enums.js';


export class UpdateCourseStatusDto {
    @IsEnum(CourseStatus)
    status: CourseStatus;
}