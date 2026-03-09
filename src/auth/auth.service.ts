import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma.service.js";
import { registerDto } from "./dtos/register.dto.js";
import bcrypt from "bcryptjs";
import { loginDto } from "./dtos/login.dto.js";
import { PayloadType } from "../utils/types.js";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class AuthService{
    constructor(
        private readonly prisma:PrismaService,
        private readonly jwtService:JwtService
    ){}

    public async register (userData:registerDto){
        const {name,email,password}=userData;
        const exsistUser=await this.prisma.user.findUnique({where:{email}})
        if(exsistUser) throw new BadRequestException("You have Account with this Email")
        const salt=await bcrypt.genSalt(10)
        const hashedPassword=await bcrypt.hash(password,salt)
        const newUser=await this.prisma.user.create({
            data:{
                name,
                email,
                password:hashedPassword
            }
        })
        // generate Token
        const payload:PayloadType={
            id:newUser.id,
            role:newUser.role
        }
        const access_token=await this.generateToken(payload)
        return {
            status:"success",
            access_token:access_token
        }
    }
    public async login (loginData:loginDto){
        const {email,password}=loginData
        // check if email or user is exist in DB
        const user=await this.prisma.user.findUnique({where:{email}})
        if(!user) throw new NotFoundException("Invalid email or password")
        // check password is valid 
        const isValidPassword=await bcrypt.compare(password,user.password as string)
        if(!isValidPassword) throw new NotFoundException("Invlaid email or password")
        // generate tokens
    
        const access_token=await this.generateToken({id:user.id,role:user.role})
        return {
            status:"success",
            access_token:access_token
        }
    }


    private async generateToken(payload:PayloadType){   
        const access_token=await this.jwtService.signAsync(payload)
        return access_token
        
    }
}