import { Module } from "@nestjs/common";
import { FileUploadService } from "./upload.service.js";
import { ConfigModule } from "@nestjs/config";

@Module({
    imports: [ConfigModule],
    providers:[FileUploadService],
    exports:[FileUploadService]
})
export class UploadFileModule{}