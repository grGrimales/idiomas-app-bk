import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Phrase } from './schemas/phrase.schema';
import { User } from '../auth/schemas/user.schema';
import { CreatePhraseDto } from './dto/create-phrase.dto';
// import { Audio } from '../schemas/audio.schema';
import { Translation } from './schemas/translation.schema';
import { Audio } from './schemas/audio.schema';
import { PlaylistsService } from 'src/playlists/playlists.service';
import { CreateManyPhrasesDto } from './dto/create-many-phrases.dto';
import { Playlist } from 'src/playlists/schemas/playlist.schema';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateDeepStudyDto } from './dto/create-deep-study.dto';
import { GetPhrasesQueryDto } from './dto/get-phrases-query.dto';
import { AwsPollyService } from 'src/common/services/aws-polly.service';
import { CloudinaryService } from 'src/common/services/cloudinary.service';
import { GenerateAudioDto } from './dto/generate-audio.dto';

@Injectable()
export class PhrasesService {
  constructor(
    @InjectModel(Phrase.name) private phraseModel: Model<Phrase>,
    @InjectModel(Playlist.name) private playlistModel: Model<Playlist>,
    private readonly playlistsService: PlaylistsService, // Inyectamos el servicio de playlists

    private readonly awsPollyService: AwsPollyService,
    private readonly cloudinaryService: CloudinaryService,
  ) { }

  async create(createPhraseDto: CreatePhraseDto, user: User): Promise<Phrase> {
    const { originalText, level, translation } = createPhraseDto;

    // 1. Obtener el playlist por defecto del usuario
    const defaultPlaylist = await this.playlistsService.findOrCreateDefaultPlaylist(user);

    // 2. Preparar los audios y la traducción como sub-documentos
    const defaultAudios: Audio[] = [
      { gender: 'femenino', audioUrl: '' },
      { gender: 'masculino', audioUrl: '' },
    ];

    const newTranslation: Translation = {
      language: translation.language,
      translatedText: translation.text,
      imageUrl: '/default/image.png', // Imagen por defecto
      audios: defaultAudios,
    };

    // 3. Crear la nueva instancia de la frase
    const newPhrase = new this.phraseModel({
      originalText,
      level,
      createdBy: user._id,
      translations: [newTranslation], // Añadimos la primera traducción
    });

    // 4. Guardar la frase en la base de datos
    // 4. Guardar la frase en la base de datos
    const savedPhrase = await newPhrase.save();

    // 5. Añadir el ID de la nueva frase al playlist por defecto y guardar el playlist
    // 👇 AQUÍ ESTÁ EL CAMBIO
    defaultPlaylist.phrases.push(savedPhrase.id); // <-- Añade solo el ID

    await defaultPlaylist.save();

    // 6. Devolver la frase creada y poblada con los datos del usuario
    return savedPhrase.populate({ path: 'createdBy', select: 'email fullName' });
  }


  async createMany(createManyDto: CreateManyPhrasesDto, user: User) {
    const { phrases: dtos, playlists: playlistNames = [], groupId } = createManyDto;

    const createdPhrases = [];
    const failedPhrases = [];

    const targetPlaylistIds = [];
    const defaultPlaylist = await this.playlistsService.findOrCreateDefaultPlaylist(user);
    targetPlaylistIds.push(defaultPlaylist._id);

    // 1. Gestión de Playlists (Se mantiene igual, previo a las frases)
    if (playlistNames.length > 0) {
      const existingPlaylists = await this.playlistModel.find({ user: user._id, name: { $in: playlistNames } });
      const existingPlaylistNames = new Set(existingPlaylists.map(p => p.name));
      targetPlaylistIds.push(...existingPlaylists.map(p => p._id));

      const newPlaylistNames = playlistNames.filter(name => !existingPlaylistNames.has(name));

      if (newPlaylistNames.length > 0) {
        const newPlaylistsToCreate = newPlaylistNames.map(name => ({ name, user: user._id, phrases: [] }));
        const createdPlaylists = await this.playlistModel.insertMany(newPlaylistsToCreate);
        targetPlaylistIds.push(...createdPlaylists.map(p => p._id));
      }
    }

    const originalTexts = dtos.map(dto => dto.originalText);
    const existingPhrasesInDb = await this.phraseModel.find({ originalText: { $in: originalTexts } });
    const existingTexts = new Set(existingPhrasesInDb.map(p => p.originalText));

    // 2. Bucle secuencial para inserción ordenada
    for (const dto of dtos) {
      // Verificación de duplicados (incluyendo duplicados dentro del mismo lote actual)
      if (existingTexts.has(dto.originalText)) {
        failedPhrases.push({ phrase: dto.originalText, reason: 'La frase ya existe.' });
        continue;
      }

      const defaultAudios: Audio[] = [
        { gender: 'femenino', audioUrl: 'audio.pendiente.mp3' },
        { gender: 'masculino', audioUrl: 'audio.pendiente.mp3' },
      ];

      const newTranslation: Translation = {
        language: dto.translation.language,
        translatedText: dto.translation.text,
        imageUrl: '/default/image.png',
        audios: defaultAudios,
      };

      try {
        // --- CAMBIO CLAVE ---
        // Usamos .create() con await dentro del bucle.
        // Esto detiene la ejecución hasta que la base de datos confirme la inserción
        // antes de pasar al siguiente DTO.
        const newPhrase = await this.phraseModel.create({
          originalText: dto.originalText,
          level: dto.level,
          createdBy: user._id,
          translations: [newTranslation],
          groupId
        });

        createdPhrases.push(newPhrase);
        existingTexts.add(dto.originalText); // Actualizamos el Set para evitar duplicados en este mismo loop

      } catch (error) {
        // Capturamos errores individuales para no detener todo el proceso si una falla
        failedPhrases.push({
          phrase: dto.originalText,
          reason: 'Error en base de datos: ' + error.message
        });
      }
    }

    // 3. Actualización de Playlists (Se hace al final con todas las IDs recolectadas)
    if (createdPhrases.length > 0) {
      const newPhraseIds = createdPhrases.map(doc => doc._id);

      await this.playlistModel.updateMany(
        { _id: { $in: targetPlaylistIds } },
        { $addToSet: { phrases: { $each: newPhraseIds } } }
      );
    }


    return { createdPhrases, failedPhrases };
  }




  async uploadAudio(
    phraseId: string,
    translationIndex: number,
    gender: string,
    file: Express.Multer.File,
  ): Promise<Phrase> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo de audio.');
    }

    const phrase = await this.phraseModel.findById(phraseId);
    if (!phrase) {
      throw new NotFoundException(`La frase con ID "${phraseId}" no fue encontrada.`);
    }

    if (!phrase.translations[translationIndex]) {
      throw new NotFoundException(`La traducción en el índice ${translationIndex} no existe.`);
    }

    const audioToUpdate = phrase.translations[translationIndex].audios.find(
      (audio) => audio.gender === gender,
    );

    // ----> ¡AQUÍ ESTÁ LA NUEVA VALIDACIÓN! <----
    if (!audioToUpdate) {
      throw new NotFoundException(`No se encontró un espacio para el audio de género "${gender}".`);
    }

    audioToUpdate.audioUrl = file.path;

    return phrase.save();
  }


  async findWithMissingAudio(user: User, query: GetPhrasesQueryDto): Promise<Phrase[]> {
    const { sortBy, playlistId } = query;
    const filter: any = {
      createdBy: user._id,
      $or: [
        { "translations.audios.audioUrl": "audio.pendiente.mp3" },
        { "translations.audios": { $size: 0 } },
        { originAudioUrl: "audio.pendiente.mp3" },
        { originAudioUrl: { $exists: false } }
      ]
    };

    const sortOptions = {};
    if (sortBy) {
      const [field, order] = sortBy.split('_');
      sortOptions[field] = order === 'asc' ? 1 : -1;
    } else {
      sortOptions['createdAt'] = -1; // Default sort
    }


    // si playlistId es igual a "" entonces que retorne todas las frases con audio o sin audios pero ordenadas por sortBy
    if (playlistId === 'todas') {
      return await this.phraseModel.find(
        {
          createdBy: user._id,

        }
      ).sort(sortOptions).exec();
    }

    if (playlistId) {
      const playlist = await this.playlistModel.findById(playlistId);
      if (playlist) {
        filter._id = { $in: playlist.phrases };
      }
    }


    return await this.phraseModel.find(filter).sort(sortOptions).exec();
  }

  async deleteAudio(phraseId: string, translationIndex: number, gender: string): Promise<Phrase> {
    const phrase = await this.phraseModel.findById(phraseId);
    if (!phrase) {
      throw new NotFoundException(`La frase con ID "${phraseId}" no fue encontrada.`);
    }

    if (gender === 'origin') {
      phrase.originAudioUrl = 'audio.pendiente.mp3';
    } else {
      if (!phrase.translations[translationIndex]) {
        throw new NotFoundException(`La traducción en el índice ${translationIndex} no existe.`);
      }
      const audioToUpdate = phrase.translations[translationIndex].audios.find(
        (audio) => audio.gender === gender,
      );
      if (!audioToUpdate) {
        throw new NotFoundException(`No se encontró un espacio para el audio de género "${gender}".`);
      }
      audioToUpdate.audioUrl = 'audio.pendiente.mp3';
    }

    return phrase.save();
  }


  async getRandomPhraseForAssessment(user: User): Promise<Phrase> {
    // Filtramos frases que pertenezcan al usuario y tengan ambos audios completos
    const aggregation = await this.phraseModel.aggregate([
      {
        $match: {
          createdBy: user._id,
          'translations.0.audios.0.audioUrl': { $ne: 'audio.pendiente.mp3' },
          'translations.0.audios.1.audioUrl': { $ne: 'audio.pendiente.mp3' }
        }
      },
      { $sample: { size: 1 } } // $sample elige un documento al azar
    ]);

    if (!aggregation.length) {
      throw new NotFoundException('No hay frases completas para iniciar una evaluación.');
    }

    return aggregation[0];
  }

  // ... otros métodos

  // NUEVO MÉTODO: Devuelve todas las frases de un usuario
  async findAll(user: User): Promise<Phrase[]> {
    return this.phraseModel.find({ createdBy: user._id }).sort({ createdAt: -1 });
  }

  async uploadOriginAudio(phraseId: string, file: Express.Multer.File): Promise<Phrase> {
    if (!file) {
      throw new BadRequestException('No se ha proporcionado ningún archivo de audio.');
    }
    const phrase = await this.phraseModel.findById(phraseId);
    if (!phrase) {
      throw new NotFoundException(`La frase con ID "${phraseId}" no fue encontrada.`);
    }
    phrase.originAudioUrl = file.path; // Asignamos la URL de Cloudinary
    return phrase.save();
  }

  async createAssessmentSession(user: User, options: CreateAssessmentDto): Promise<Phrase[]> {
    const { playlistId, orderBy, limit, groupIds } = options;


    const pipeline: any[] = [];

    // --- 1. Filtrar por Playlist (si se proporciona) ---
    if (playlistId) {
      const playlist = await this.playlistModel.findOne({ _id: playlistId, user: user._id });
      if (!playlist) throw new NotFoundException('Playlist no encontrada');
      // filtrar por play list y las frases que contiene audios completos
      pipeline.push({ $match: { _id: { $in: playlist.phrases }, 'translations.0.audios.0.audioUrl': { $ne: 'audio.pendiente.mp3' }, 'translations.0.audios.1.audioUrl': { $ne: 'audio.pendiente.mp3' } } });

    } else {
      // Si no hay playlist, filtramos por todas las frases del usuario
      pipeline.push({ $match: { 'translations.0.audios.0.audioUrl': { $ne: 'audio.pendiente.mp3' }, 'translations.0.audios.1.audioUrl': { $ne: 'audio.pendiente.mp3' } } });
    }

    // filtrar por groupIds si se proporcionan
    if (groupIds && groupIds.length > 0) {
      pipeline[0].$match.groupId = { $in: groupIds };
    }


    // --- 2. Ordenamiento ---
    if (orderBy === 'random') {
      pipeline.push({ $sample: { size: limit } });
    } else {
      // Para ordenar por estadísticas, necesitamos unir con UserPhraseStats
      pipeline.push(
        {
          $lookup: {
            from: 'userphrasestats', // El nombre de la colección en la DB
            let: { phraseId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$phrase', '$$phraseId'] }, { $eq: ['$user', user._id] }] } } },
            ],
            as: 'stats',
          },
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } }
      );

      if (orderBy === 'least_attempted') {
        pipeline.push({ $addFields: { totalAttempts: { $add: ['$stats.evalSuccessCount', '$stats.evalFailCount'] } } });
        pipeline.push({ $sort: { totalAttempts: 1 } });
      }

      if (orderBy === 'least_successful') {
        pipeline.push({
          $addFields: {
            successRatio: {
              $cond: {
                if: { $gt: [{ $add: ['$stats.evalSuccessCount', '$stats.evalFailCount'] }, 0] },
                then: { $divide: ['$stats.evalSuccessCount', { $add: ['$stats.evalSuccessCount', '$stats.evalFailCount'] }] },
                else: 1, // Si no hay intentos, se considera 100% exitoso para que no aparezca primero
              },
            },
          },
        });
        pipeline.push({ $sort: { successRatio: 1 } });
      }
      pipeline.push({ $limit: limit });
    }

    // 👇 === CAMBIO IMPORTANTE AQUÍ === 👇
    const aggregatedPhrases = await this.phraseModel.aggregate(pipeline);

    // Populamos las traducciones después de la agregación
    await this.phraseModel.populate(aggregatedPhrases, { path: 'translations' });

    return aggregatedPhrases;
  }

  // ... (dentro de la clase PhrasesService)
  async createDeepStudySession(user: User, options: CreateDeepStudyDto): Promise<Phrase[]> {
    const { playlistId, orderBy, limit, groupIds } = options;

    // Objeto base para el filtro inicial
    const matchFilter: any = {

      // 👇 === ¡AQUÍ ESTÁ LA CORRECCIÓN! === 👇
      // Se asegura que ambos audios de traducción existan y no sean el placeholder.
      // Ya no se requiere el 'originAudioUrl'.
      'translations.0.audios': {
        $all: [
          { $elemMatch: { gender: "femenino", audioUrl: { $ne: 'audio.pendiente.mp3' } } },
          { $elemMatch: { gender: "masculino", audioUrl: { $ne: 'audio.pendiente.mp3' } } }
        ]
      }
    };

    // filtrar por groupIds si se proporcionan
    if (groupIds && groupIds.length > 0) {
      matchFilter.groupId = { $in: groupIds };
    }

    // 1. Filtrar por Playlist (si se proporciona)
    if (playlistId) {
      const playlist = await this.playlistModel.findOne({ _id: playlistId, user: user._id });
      if (!playlist) throw new NotFoundException('Playlist no encontrada');
      matchFilter._id = { $in: playlist.phrases };
    }

    const pipeline: any[] = [{ $match: matchFilter }];

    // 2. Ordenamiento
    if (orderBy === 'random') {
      pipeline.push({ $sample: { size: limit } });
    } else { // 'least_studied'
      pipeline.push(
        {
          $lookup: {
            from: 'userphrasestats',
            let: { phraseId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$phrase', '$$phraseId'] }, { $eq: ['$user', user._id] }] } } },
            ],
            as: 'stats',
          },
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
        // Ordenamos por 'deepStudyCount'. Los que no tengan stats (null) irán primero.
        { $sort: { 'stats.deepStudyCount': 1 } },
        { $limit: limit }
      );
    }

    // 3. Obtener y popular los resultados
    const aggregatedPhrases = await this.phraseModel.aggregate(pipeline);
    await this.phraseModel.populate(aggregatedPhrases, { path: 'translations' });

    return aggregatedPhrases;
  }


  async createRelaxSession(user: User, config: any): Promise<Phrase[]> {
    const { playlistId, orderBy, limit } = config;

    const numericLimit = Number(limit) || 10;



    // Filtro base para las frases del usuario
    const matchFilter: any = {
      'translations.0.audios': {
        $all: [
          { $elemMatch: { gender: "femenino", audioUrl: { $ne: 'audio.pendiente.mp3' } } },
          { $elemMatch: { gender: "masculino", audioUrl: { $ne: 'audio.pendiente.mp3' } } }
        ]
      }
    };

    // 1. Filtrar por Playlist (si se proporciona)
    if (playlistId) {
      const playlist = await this.playlistModel.findOne({ _id: playlistId, user: user._id });
      if (!playlist) throw new NotFoundException('Playlist no encontrada');
      matchFilter._id = { $in: playlist.phrases };
    }

    const pipeline: any[] = [{ $match: matchFilter }];

    // 2. Ordenamiento
    if (orderBy === 'random') {
      pipeline.push({ $sample: { size: numericLimit } });
    } else { // 'least_studied'

      pipeline.push(
        {
          $lookup: {
            from: 'userphrasestats',
            let: { phraseId: '$_id' },
            pipeline: [
              { $match: { $expr: { $and: [{ $eq: ['$phrase', '$$phraseId'] }, { $eq: ['$user', user._id] }] } } },
            ],
            as: 'stats',
          },
        },
        { $unwind: { path: '$stats', preserveNullAndEmptyArrays: true } },
        // Ordenamos por 'deepStudyCount'. Los que no tengan stats (null) irán primero.
        { $sort: { 'stats.relaxListenCount': 1 } },
        { $limit: numericLimit }
      );
    }

    // 3. Obtener y popular los resultados
    const aggregatedPhrases = await this.phraseModel.aggregate(pipeline);
    await this.phraseModel.populate(aggregatedPhrases, { path: 'translations' });

    return aggregatedPhrases;
  }




  async generateAndSaveAudio(user: User, phraseId: string, generateDto: GenerateAudioDto): Promise<Phrase> {
    const { voiceId, target, index, gender } = generateDto;

    // 1. Buscar la frase
    const phrase = await this.phraseModel.findOne({ _id: phraseId, createdBy: user._id });
    if (!phrase) {
      throw new NotFoundException(`Frase no encontrada o no tienes permisos.`);
    }

    let textToSynthesize = '';

    // 2. Determinar el texto a convertir
    if (target === 'origin') {
      textToSynthesize = phrase.originalText;
    } else {
      // Validaciones para traducciones
      if (index === undefined || !phrase.translations[index]) {
        throw new NotFoundException(`La traducción en el índice ${index} no existe.`);
      }
      textToSynthesize = phrase.translations[index].translatedText;
    }

    // 3. Generar Audio con AWS Polly
    const audioBuffer = await this.awsPollyService.generateAudio(textToSynthesize, voiceId);

    // 4. Subir a Cloudinary (directamente desde el Buffer)
    // El folder lo definimos aquí o en el servicio. Polly + ID para evitar colisiones
    const uploadResult = await this.cloudinaryService.uploadBuffer(audioBuffer, 'idiomas-app/generated-audios');

    // 5. Guardar la URL en la base de datos
    if (target === 'origin') {
      phrase.originAudioUrl = uploadResult.secure_url;
    } else {
      // Lógica para actualizar el audio específico dentro del array de traducciones
      if (!gender) throw new BadRequestException('El género es requerido para audios de traducción.');

      const audioToUpdate = phrase.translations[index].audios.find(a => a.gender === gender);

      if (!audioToUpdate) {
        // Si no existe el slot, podrías crearlo, pero basándonos en tu lógica anterior, lanzamos error
        throw new NotFoundException(`No se encontró slot de audio para género ${gender} en la traducción.`);
      }

      audioToUpdate.audioUrl = uploadResult.secure_url;
    }

    return await phrase.save();
  }



}