import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayNotEmpty, IsString, IsOptional, IsNotEmpty } from 'class-validator';
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


  /*
  @Prop({ type: Number, required: true })
  groupId: number;
  */

  @IsNotEmpty()
  groupId: number;

}