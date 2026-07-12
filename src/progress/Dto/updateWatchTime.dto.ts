// updateWatchTime.dto.ts
import { ApiProperty } from "@nestjs/swagger";
import { IsInt, Min } from "class-validator";

export class UpdateWatchTimeDto {
    @ApiProperty({ example: 120, minimum: 1, description: "Watch time in seconds" })
    @IsInt()
    @Min(1)
    watchTime: number;
}