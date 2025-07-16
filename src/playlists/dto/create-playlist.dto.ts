import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class CreatePlaylistDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}