import { PlaylistsService } from './playlists.service';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/schemas/user.schema';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { AddPhrasesToPlaylistDto } from './dto/add-phrases-to-playlist.dto';
import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@Controller('playlists')
@UseGuards(AuthGuard()) // Proteger todas las rutas de este controlador
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) { }

  @Post()
  create(@Body() createPlaylistDto: CreatePlaylistDto, @GetUser() user: User) {
    return this.playlistsService.create(createPlaylistDto, user);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.playlistsService.findAllByUser(user);
  }

  
  @Post(':id/phrases')
  addPhrases(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() addPhrasesDto: AddPhrasesToPlaylistDto,
    @GetUser() user: User
  ) {
    return this.playlistsService.addPhrases(id, addPhrasesDto, user);
  }



  // obtener grupos por id de playlist
  @Get(':id/groups')
  getGroupsByPlaylistId(@Param('id', ParseMongoIdPipe) id: string) {
    return this.playlistsService.getGroupsByPlaylistId(id);
  }
}