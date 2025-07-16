// bk-src/src/phrases/dto/create-deep-study.dto.ts
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min } from 'class-validator';

const studyOrders = ['least_studied', 'random'] as const;
type StudyOrder = typeof studyOrders[number];

export class CreateDeepStudyDto {
  @IsOptional()
  @IsMongoId()
  playlistId?: string;

  @IsIn(studyOrders)
  orderBy: StudyOrder;

  @IsInt()
  @Min(1)
  @Max(50)
  limit: number;
}