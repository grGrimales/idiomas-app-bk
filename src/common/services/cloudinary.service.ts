import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
    constructor(@Inject('Cloudinary') private cloudinaryInstance: typeof cloudinary) { }

    async uploadBuffer(buffer: Buffer, folder: string = 'idiomas-app'): Promise<UploadApiResponse> {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinaryInstance.uploader.upload_stream(
                {
                    folder: folder,
                    resource_type: 'video', // Cloudinary trata el audio como 'video' a menudo, o 'auto'
                    format: 'mp3',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                },
            );

            // Convertir el buffer a un stream legible y enviarlo a Cloudinary
            const stream = Readable.from(buffer);
            stream.pipe(uploadStream);
        });
    }
}