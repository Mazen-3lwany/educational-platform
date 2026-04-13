import { IsNotEmpty, IsString, Length } from "class-validator";

export class createLessonDto{
    @IsString()
    @IsNotEmpty()
    @Length(6,20)
    title:string
    @IsString()
    @IsNotEmpty()
    @Length(20,100)
    description:string
}