import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import * as googleTTS from 'google-tts-api';

@Injectable()
export class GoogleTtsService {

    /**
     * Genera un audio en inglés usando la API no oficial de Google Translate.
     * Nota: Tiene un límite de 200 caracteres por solicitud.
     * @param text El texto en inglés a convertir.
     * @returns Un Buffer con el audio en formato MP3.
     */
    async generateAudio(text: string): Promise<Buffer> {

        // 1. Validación de seguridad (Limitación de la API Free)
        if (text.length > 200) {
            throw new BadRequestException(
                'Google TTS Free limit is 200 characters. For longer text, please use ElevenLabs or split the text.'
            );
        }

        try {
            // 2. Solicitar el audio en Base64
            const base64Audio = await googleTTS.getAudioBase64(text, {
                lang: 'en',        // Idioma: Inglés
                slow: false,       // Velocidad normal (true para lento)
                host: 'https://translate.google.com',
                timeout: 10000,    // 10 segundos de timeout
            });

            // 3. Convertir Base64 a Buffer (Lo que necesita Cloudinary)
            return Buffer.from(base64Audio, 'base64');

        } catch (error) {
            console.error('Google TTS Service Error:', error.message);

            // Manejo de errores específicos
            if (error.message.includes('timeout')) {
                throw new InternalServerErrorException('Google TTS request timed out.');
            }

            throw new BadRequestException('Failed to generate audio via Google TTS.');
        }
    }
}