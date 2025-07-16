// src/statistics/dto/update-stats.dto.ts
import { IsBoolean, IsMongoId } from 'class-validator';

export class UpdateStatsDto {
  @IsMongoId()
  phraseId: string;

  @IsBoolean()
  isCorrect: boolean;
}