// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { CloudinaryService } from './services/cloudinary.service';
import { ElevenLabsService } from './services/elevenlabs.service';
import { GoogleTtsService } from './services/google-tts.service';
import { AwsPollyService } from './services/aws-polly.service';

@Module({
    providers: [
        CloudinaryService,
        ElevenLabsService,
        GoogleTtsService,
        AwsPollyService
    ],
    exports: [
        CloudinaryService,
        ElevenLabsService,
        GoogleTtsService,
        AwsPollyService
    ] // <--- ¡CRUCIAL! Esto hace que sean "públicos" para otros módulos
})
export class CommonModule { }