import { IsEmail, IsString} from "class-validator";

export class emailDto {
    @IsEmail()
    @IsString()
    email:string
}