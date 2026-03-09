import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MailService } from "./mail.service.js";


@Module({
    imports:[
        ConfigModule.forRoot({
            isGlobal:true
        }),
        MailerModule.forRootAsync({
            inject:[ConfigService],
            useFactory:(configService:ConfigService)=>({
                transport:{
                    host:configService.get<string>('SMTP_HOST'),
                    port:configService.get<number>("SMTP_PORT"),
                    auth:{
                        user:configService.get<string>("SMTP_USER_NAME"),
                        pass:configService.get<string>('SMTP_PASS')
                    }
                }
            })
        })
    ],
    providers:[MailService],
    exports:[MailService]
})
export class MailModule {}