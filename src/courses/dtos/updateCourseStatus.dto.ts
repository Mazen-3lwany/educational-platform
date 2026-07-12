import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { CourseStatus } from '../../../generated/prisma/enums.js';

export class UpdateCourseStatusDto {
    @ApiProperty({ enum: CourseStatus, example: Object.values(CourseStatus)[0] })
    @IsEnum(CourseStatus)
    status: CourseStatus;
}