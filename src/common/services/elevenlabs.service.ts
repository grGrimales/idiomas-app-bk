// src/common/services/elevenlabs.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class ElevenLabsService {
    private readonly apiKey = process.env.ELEVENLABS_API_KEY;
    private readonly apiUrl = process.env.ELEVENLABS_API_URL;

    async generateAudio(text: string, voiceId: string = '21m00Tcm4TlvDq8ikWAM'): Promise<Buffer> {
        try {
            // '21m00Tcm4TlvDq8ikWAM' es el ID de voz por defecto (Rachel)
            const url = `${this.apiUrl}/text-to-speech/${voiceId}`;

            const response = await axios.post(
                url,
                {
                    text: text,
                    model_id: 'eleven_multilingual_v2',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.5,
                    },
                },
                {
                    headers: {
                        'xi-api-key': this.apiKey,
                        'Content-Type': 'application/json',
                    },
                    responseType: 'arraybuffer', // CRUCIAL: Necesitamos los bytes, no texto
                },
            );

            return Buffer.from(response.data);
        } catch (error) {
            const errorData = error.response?.data;
            const errorMessage = Buffer.isBuffer(errorData)
                ? errorData.toString('utf8') // Convierte los números raros a texto
                : error.message;

            console.error('ElevenLabs Error:', errorMessage);

            throw new BadRequestException('Failed to generate audio via ElevenLabs');
        }
    }
}