import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";

@Injectable()
export class MailService {
    constructor(private mailer: MailerService) { }
    public async verificationEmail(email: string, link: string) {
        return this.mailer.sendMail({
            to: email,
            subject: "Verify your email address",
            html: `
                <div style="font-family: Arial, sans-serif; line-height:1.6">
                <h2>Verify your email</h2>

                <p>Welcome to our platform!</p>

                <p>
                    Please click the button below to verify your email address and activate
                    your account.
                </p>

                <a
                    href="{${link}}"
                    style="
                            display:inline-block;
                            padding:12px 20px;
                            background-color:#4CAF50;
                            color:white;
                            text-decoration:none;
                            border-radius:5px;
                            margin-top:10px;
                        "
                >
                                Verify Email
                </a>

    <p style="margin-top:20px">
        If you did not create an account, you can safely ignore this email.
    </p>
    <p>Thanks,<br/>The Team</p>
</div>
                `
        })
    }
}