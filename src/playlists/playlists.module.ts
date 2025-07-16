import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Playlist, PlaylistSchema } from './schemas/playlist.schema';
import { AuthModule } from '../auth/auth.module';
import { PlaylistsService } from './playlists.service';
import { PlaylistsController } from './playlists.controller';
import { Phrase, PhraseSchema } from 'src/phrases/schemas/phrase.schema';

@Module({
  imports: [
    // Importamos el esquema de Playlist
    MongooseModule.forFeature([{ name: Playlist.name, schema: PlaylistSchema },     { name: Phrase.name, schema: PhraseSchema }]),
    AuthModule,
  ],
  controllers: [PlaylistsController],
  providers: [PlaylistsService],
  // Exportamos el MongooseModule para que otros módulos (como PhrasesModule) puedan usar el modelo Playlist
  exports: [MongooseModule,PlaylistsService], 
})
export class PlaylistsModule {}