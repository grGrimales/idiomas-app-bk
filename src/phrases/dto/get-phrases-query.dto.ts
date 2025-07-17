import { IsOptional, IsString, IsIn } from 'class-validator';

export class GetPhrasesQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['createdAt_asc', 'createdAt_desc'])
  sortBy?: string;

  @IsOptional()
  @IsString()
  playlistId?: string;
}