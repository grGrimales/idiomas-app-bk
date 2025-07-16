import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { Phrase, PhraseSchema } from './schemas/phrase.schema';
import { UserPhraseStats, UserPhraseStatsSchema } from './schemas/user-phrase-stats.schema';
import { AuthModule } from '../auth/auth.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { PhrasesController } from './phrases.controller';
import { PhrasesService } from './phrases.service';
import { Playlist, PlaylistSchema } from 'src/playlists/schemas/playlist.schema';

@Module({
  imports: [
    // Importamos los esquemas que se usarán en este módulo
    MongooseModule.forFeature([
      { name: Phrase.name, schema: PhraseSchema },
      { name: UserPhraseStats.name, schema: UserPhraseStatsSchema },
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
    AuthModule,
    PlaylistsModule,
    
    // CONFIGURACIÓN CENTRALIZADA DE MULTER Y CLOUDINARY
    MulterModule.registerAsync({
      imports: [ConfigModule], // Importamos ConfigModule para usar las variables de entorno
      useFactory: async (configService: ConfigService) => {
        // Configuramos Cloudinary con las credenciales del .env
        cloudinary.config({
          cloud_name: configService.get<string>('CLOUDINARY_CLOUD_NAME'),
          api_key: configService.get<string>('CLOUDINARY_API_KEY'),
          api_secret: configService.get<string>('CLOUDINARY_API_SECRET'),
        });

        return {
          storage: new CloudinaryStorage({
            cloudinary: cloudinary, // Pasamos la instancia ya configurada
            params: {
              folder: 'idiomas-app-audios', // Carpeta en Cloudinary
              resource_type: 'video', // Cloudinary trata los mp3 como 'video'
              format: 'mp3',
            } as any, // 'any' para evitar problemas de tipado con 'params'
          }),
        };
      },
      inject: [ConfigService], // Inyectamos el servicio de configuración
    }),
  ],
  controllers: [PhrasesController],
  providers: [PhrasesService],
   exports: [MongooseModule]
})
export class PhrasesModule {}