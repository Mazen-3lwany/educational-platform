import {IsNotEmpty, IsString, Length} from "class-validator"
export class changePasswordType{
    @IsString()
    @IsNotEmpty()
    @Length(6)
    oldPass:string
    @IsString()
    @IsNotEmpty()
    @Length(6)
    newPass:string
    @IsString()
    @IsNotEmpty()
    @Length(6)
    confirmPass:string
}