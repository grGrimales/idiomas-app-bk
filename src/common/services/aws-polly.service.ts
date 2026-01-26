import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PollyClient, SynthesizeSpeechCommand, SynthesizeSpeechCommandInput, VoiceId } from '@aws-sdk/client-polly';

@Injectable()
export class AwsPollyService {
    private client: PollyClient;

    constructor() {
        this.client = new PollyClient({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
    }

    /**
     * Genera audio intentando usar el motor Neural. 
     * Si la voz no soporta Neural, hace fallback automático a Standard.
     */
    async generateAudio(text: string, voiceId: string = 'Joey'): Promise<Buffer> {
        if (!text) throw new BadRequestException('Text is required');

        // Configuración base
        const params: SynthesizeSpeechCommandInput = {
            Text: text,
            OutputFormat: 'mp3',
            VoiceId: voiceId as VoiceId,
            Engine: 'neural', // Intentamos Neural primero por defecto
        };

        try {
            return await this.synthesize(params);
        } catch (error) {
            // Si el error es específicamente que la voz no soporta el motor seleccionado
            if (error.name === 'ValidationException' && error.message.includes('does not support the selected engine')) {
                console.warn(`AWS Polly: La voz '${voiceId}' no soporta 'neural'. Reintentando con 'standard'...`);

                // Cambiamos a motor Standard y reintentamos
                params.Engine = 'standard';
                return await this.synthesize(params);
            }

            console.error('AWS Polly Error:', error);
            throw new InternalServerErrorException(`Failed to generate audio via AWS Polly: ${error.message}`);
        }
    }

    // Método auxiliar privado para ejecutar el comando
    private async synthesize(params: SynthesizeSpeechCommandInput): Promise<Buffer> {
        const command = new SynthesizeSpeechCommand(params);
        const response = await this.client.send(command);

        if (!response.AudioStream) {
            throw new InternalServerErrorException('AWS Polly did not return an audio stream');
        }

        const byteArray = await response.AudioStream.transformToByteArray();
        return Buffer.from(byteArray);
    }
}