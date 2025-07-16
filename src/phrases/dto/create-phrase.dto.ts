import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { Level } from '../../common/enums/level.enum';

// DTO para la traducción que viene dentro de la frase
export class CreateTranslationDto {
  @IsString()
  @IsNotEmpty()
  language: string; // ej: 'en'

  @IsString()
  @IsNotEmpty()
  text: string;
}

// DTO principal para crear la frase
export class CreatePhraseDto {
  @IsString()
  @IsNotEmpty()
  originalText: string;

  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @IsNotEmpty()
  translation: CreateTranslationDto;
}