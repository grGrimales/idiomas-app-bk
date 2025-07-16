// src/seed/seed.service.ts

import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Phrase } from '../phrases/schemas/phrase.schema';
import { Playlist } from '../playlists/schemas/playlist.schema';
import { User } from '../auth/schemas/user.schema';
import { SEED_PHRASES } from './data/seed-data';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Phrase.name) private readonly phraseModel: Model<Phrase>,
    @InjectModel(Playlist.name) private readonly playlistModel: Model<Playlist>,
  ) {}

  async populateDB() {
    // 1. Limpiar la base de datos en el orden correcto
    await this.playlistModel.deleteMany({});
    await this.phraseModel.deleteMany({});
    await this.userModel.deleteMany({});

    // 2. Crear un usuario de prueba
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash('password123', salt);
    const user = await this.userModel.create({
      email: 'user@example.com',
      password: hashedPassword,
      fullName: 'Test User',
      isActive: true,
    });

    // 3. Preparar las frases asignando el ID del usuario creado
    const phrasesToCreate = SEED_PHRASES.map(phrase => ({
      ...phrase,
      createdBy: user._id,
    }));

    const createdPhrases = await this.phraseModel.insertMany(phrasesToCreate);

    // 4. Crear una playlist por defecto para ese usuario
    await this.playlistModel.create({
      name: 'Mis Frases',
      isDefault: true,
      user: user._id,
      phrases: createdPhrases.map(p => p._id),
    });

    return { message: 'Seed executed successfully with correct data structure.' };
  }
}