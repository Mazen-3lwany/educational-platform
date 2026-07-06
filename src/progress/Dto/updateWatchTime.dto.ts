import { IsInt, Min } from "class-validator";

export class UpdateWatchTimeDto {
  @IsInt()
  @Min(1)
  watchTime: number;
}