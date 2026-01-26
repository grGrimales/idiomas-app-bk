// src/common/dto/pagination.dto.ts
import { IsOptional, IsPositive, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @IsOptional()
    @IsPositive()
    @Type(() => Number) // Transforma el string "1" de la URL a number 1
    limit: number = 10; // Valor por defecto

    @IsOptional()
    @Min(0)
    @Type(() => Number)
    offset: number = 0; // O puedes usar lógica de 'page', aquí usaré offset directo para flexibilidad
}