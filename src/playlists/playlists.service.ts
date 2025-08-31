import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Playlist } from './schemas/playlist.schema';
import { User } from '../auth/schemas/user.schema';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { AddPhrasesToPlaylistDto } from './dto/add-phrases-to-playlist.dto';
import { Phrase } from 'src/phrases/schemas/phrase.schema';
import { Model, Types } from 'mongoose';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<Playlist>,
    @InjectModel(Phrase.name) private phraseModel: Model<Phrase>,
  ) { }

  // Encuentra el playlist por defecto de un usuario, si no existe, lo crea.
  async findOrCreateDefaultPlaylist(user: User): Promise<Playlist> {
    // Buscamos un playlist que sea 'default' y pertenezca al usuario
    let defaultPlaylist = await this.playlistModel.findOne({
      user: user._id,
      isDefault: true,
    });

    // Si no lo encontramos, lo creamos
    if (!defaultPlaylist) {
      defaultPlaylist = new this.playlistModel({
        name: 'Mis Frases', // Nombre por defecto
        user: user._id,
        isDefault: true,
        phrases: [],
      });
      await defaultPlaylist.save();
    }

    return defaultPlaylist;
  }

  async findAllByUser(user: User): Promise<Playlist[]> {

    const allPlayList = await this.playlistModel.find().exec();


    const playlists = await this.playlistModel.find({ user: { $in: user._id } }).exec();

    return playlists;
  }

  async create(createPlaylistDto: CreatePlaylistDto, user: User): Promise<Playlist> {
    const { name } = createPlaylistDto;

    // 1. Buscamos si ya existe un playlist con el mismo nombre para este usuario.
    const existingPlaylist = await this.playlistModel.findOne({
      name: name,
      user: user._id,
    });

    // 2. Si existe, lanzamos un error 409 Conflict.
    if (existingPlaylist) {
      throw new ConflictException(`Ya tienes un playlist con el nombre "${name}".`);
    }

    // 3. Si no existe, procedemos a crearlo.
    const newPlaylist = new this.playlistModel({
      name,
      user: [user._id],
      isDefault: false,
      phrases: [],
    });




    return newPlaylist.save();
  }


  async addPhrases(
    playlistId: string,
    addPhrasesDto: AddPhrasesToPlaylistDto,
    user: User,
  ): Promise<Playlist> {
    const { phraseIds } = addPhrasesDto;

    // 1. Buscamos el playlist para asegurarnos de que existe y pertenece al usuario.
    const playlist = await this.playlistModel.findOne({
      _id: playlistId,
      user: user._id,
    });

    if (!playlist) {
      throw new NotFoundException(`El playlist con ID "${playlistId}" no fue encontrado.`);
    }

    // 2. Verificamos que todas las frases que se quieren añadir realmente existen.
    const foundPhrases = await this.phraseModel.find({
      _id: { $in: phraseIds },
    });

    if (foundPhrases.length !== phraseIds.length) {
      throw new NotFoundException('Una o más de las frases que intentas añadir no existen.');
    }

    // 3. Añadimos solo las frases que no estén ya en el playlist para evitar duplicados.
    const existingPhraseIdsInPlaylist = new Set(playlist.phrases.map(id => id.toString()));
    const newPhraseIdsAsStrings = phraseIds.filter(id => !existingPhraseIdsInPlaylist.has(id));

    if (newPhraseIdsAsStrings.length > 0) {
      // Convierte los strings a ObjectIds
      const newPhraseObjectIds = newPhraseIdsAsStrings.map(id => new Types.ObjectId(id));

      // Añade los ObjectIds al array
      playlist.phrases.push(...newPhraseObjectIds);
      await playlist.save();
    }
    return playlist.populate({ path: 'phrases', model: 'Phrase' });
  }



  async getGroupsByPlaylistId(playlistId: string) {

    if (!playlistId) {
      throw new BadRequestException('ID de playlist es requerido');
    }
    if (!Types.ObjectId.isValid(playlistId)) {
      throw new BadRequestException('ID de playlist inválido');
    }

    // [Nest] 33156  - 30/08/2025, 14:47:36   ERROR [ExceptionsHandler] Cannot populate path `groups` because it is not in your schema. Set the `strictPopulate` option to false to override.
    const playList = await this.playlistModel.findById(playlistId).exec();


    const phrases = await this.phraseModel.find({ _id: { $in: playList.phrases } }).exec();

    const uniqueGroupsByPhrase = Array.from(new Set(phrases.map(phrase => phrase.groupId)));


    /*
    interface Group {
  _id: string;
  name: string;
}*/
    return uniqueGroupsByPhrase.map((groupId) => ({
      _id: groupId,
      name: `${groupId}`
    }));
  }




}