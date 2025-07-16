// src/statistics/statistics.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/schemas/user.schema';
// Asegúrate de que la ruta de importación sea la correcta según tu proyecto
import { UserPhraseStats } from '../phrases/schemas/user-phrase-stats.schema';

@Injectable()
export class StatisticsService {
  constructor(
    // Inyectamos el modelo existente UserPhraseStats
    @InjectModel(UserPhraseStats.name)
    private statsModel: Model<UserPhraseStats>,
  ) {}

  async updateStats(user: User, phraseId: string, isCorrect: boolean) {
    // Usamos los nombres de campo de TU esquema: evalSuccessCount y evalFailCount
    const update = {
      $inc: {
        evalSuccessCount: isCorrect ? 1 : 0,
        evalFailCount: isCorrect ? 0 : 1,
      },
    };

    // La lógica de buscar y actualizar/crear sigue siendo la misma y es correcta
    return this.statsModel.findOneAndUpdate(
      { user: user._id, phrase: phraseId },
      update,
      { upsert: true, new: true },
    );
  }

  async incrementDeepStudyCount(user: User, phraseId: string) {
  return this.statsModel.findOneAndUpdate(
    { user: user._id, phrase: phraseId },
    { $inc: { deepStudyCount: 1 } }, // Incrementamos el contador correcto
    { upsert: true, new: true },
  );
}
}