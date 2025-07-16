import { IsMongoId, IsArray, ArrayNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class AddPhrasesToPlaylistDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  phraseIds: string[];
}