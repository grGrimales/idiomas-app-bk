// src/statistics/statistics.module.ts

import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { StatisticsService } from './statistics.service';
// Importamos el módulo que ya exporta el modelo de UserPhraseStats
import { PhrasesModule } from 'src/phrases/phrases.module';
import { StatisticsController } from './statistics.controller';

@Module({
  imports: [
    PhrasesModule, // PhrasesModule nos da acceso a UserPhraseStats
    AuthModule,
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService,],
})
export class StatisticsModule {}