// src/phrases/dto/create-assessment.dto.ts
import { IsIn, IsInt, IsMongoId, IsOptional, Max, Min,IsArray } from 'class-validator';

const assessmentOrders = ['random', 'least_successful', 'least_attempted'] as const;
type AssessmentOrder = typeof assessmentOrders[number];

export class CreateAssessmentDto {
  @IsOptional()
  @IsMongoId()
  playlistId?: string;

  @IsIn(assessmentOrders)
  orderBy: AssessmentOrder;

  @IsInt()
  @Min(1)
  @Max(50)
  limit: number;



  @IsArray()
  @IsInt({ each: true })
  groupIds: number[];

}