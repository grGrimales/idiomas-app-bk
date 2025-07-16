import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PhrasesModule } from './phrases/phrases.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { SeedModule } from './seed/seed.module';
import { StatisticsModule } from './statistics/statistics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Hace que ConfigModule esté disponible en toda la app
    }),
    // Configuración de Mongoose
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        // Recomiendo poner la URL en un archivo .env
        uri: configService.get<string>('MONGO_URI'), 
      }),
    }),
    AuthModule,
    PhrasesModule,
    PlaylistsModule,
    SeedModule,
    StatisticsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}