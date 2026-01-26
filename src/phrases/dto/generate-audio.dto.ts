import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsIn } from 'class-validator';

export class GenerateAudioDto {
    @IsString()
    @IsNotEmpty()
    voiceId: string; // Ej: 'Lupe', 'Matthew', 'Joanna'

    @IsString()
    @IsNotEmpty()
    @IsIn(['origin', 'translation'])
    target: 'origin' | 'translation';

    // Opcionales, solo si target es 'translation'
    @IsNumber()
    @IsOptional()
    index?: number;

    @IsString()
    @IsOptional()
    @IsIn(['femenino', 'masculino'])
    gender?: string;
}