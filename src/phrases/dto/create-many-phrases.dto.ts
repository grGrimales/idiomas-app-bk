import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayNotEmpty, IsString, IsOptional } from 'class-validator';
import { CreatePhraseDto } from './create-phrase.dto';

export class CreateManyPhrasesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreatePhraseDto)
  phrases: CreatePhraseDto[];

    @IsArray()
  @IsString({ each: true })
  @IsOptional() // Hacemos que este campo sea opcional
  playlists?: string[];
}