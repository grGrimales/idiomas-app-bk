import { Module } from '@nestjs/common';
import { SeedService } from './seed.service';
import { SeedController } from './seed.controller';
import { PhrasesModule } from '../phrases/phrases.module';
import { PlaylistsModule } from '../playlists/playlists.module';
import { AuthModule } from 'src/auth/auth.module';


@Module({
  controllers: [SeedController],
  providers: [SeedService],
  imports: [
    // Importamos los módulos que exportan los modelos que necesitamos
    PhrasesModule,
    PlaylistsModule,
    AuthModule
  ],
})
export class SeedModule {}