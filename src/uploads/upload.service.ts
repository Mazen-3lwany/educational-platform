import { BadRequestException, Injectable } from "@nestjs/common"
import { ConfigService } from "@nestjs/config";

import { v2 as cloudinary, UploadApiResponse } from "cloudinary";



@Injectable()

export class FileUploadService {
    constructor(private configService: ConfigService) {
        cloudinary.config({
            cloud_name: this.configService.get('CLOUD_NAME'),
            api_key: this.configService.get('CLOUD_API_KEY'),
            api_secret: this.configService.get('CLOUD_API_SECRET'),
            secure: true,
        });
    }
    async uploadFile(file: Express.Multer.File): Promise<UploadApiResponse> {
        if (!file) throw new BadRequestException("No file provided");

        return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'users',
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary error:", error);
                        return reject(new Error(error.message || 'Upload failed'));
                    }
                    resolve(result!);
                }
            );
            stream.end(file.buffer);
        });
    }

    async deleteFile(public_Id: string) {
        await cloudinary.uploader.destroy(public_Id)
    }
    
}