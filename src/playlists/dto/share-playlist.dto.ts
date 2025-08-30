import { IsArray, IsEmail } from 'class-validator';

export class SharePlaylistDto {
  @IsArray()
  @IsEmail({}, { each: true, message: 'Cada elemento en la lista debe ser un email válido.' })
  emails: string[];
}