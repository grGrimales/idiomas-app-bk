import { Controller, Post, Body, UseGuards, Patch, UseInterceptors, Param, ParseIntPipe, UploadedFile, Get, Req, Delete, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateManyPhrasesDto } from './dto/create-many-phrases.dto';
import { PhrasesService } from './phrases.service';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateDeepStudyDto } from './dto/create-deep-study.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/schemas/user.schema';
import { GetPhrasesQueryDto } from './dto/get-phrases-query.dto';

@Controller('phrases')
@UseGuards(AuthGuard()) // Proteger todas las rutas de este controlador
export class PhrasesController {
  constructor(private readonly phrasesService: PhrasesService) { }

  @Delete(':id/translations/:index/audio/:gender')
  deleteAudio(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
    @Param('gender') gender: string,
  ) {
    return this.phrasesService.deleteAudio(id, index, gender);
  }

  @Patch(':id/translations/:index/audio/:gender')
  // El FileInterceptor ahora usará automáticamente la configuración del módulo
  @UseInterceptors(FileInterceptor('file'))
  uploadAudio(
    @Param('id', ParseMongoIdPipe) id: string,
    @Param('index', ParseIntPipe) index: number,
    @Param('gender') gender: string,
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: User, // Aunque no se use aquí, es bueno mantenerlo por si se añade lógica de permisos
  ) {
    return this.phrasesService.uploadAudio(id, index, gender, file);
  }

  @Post()
  create(@Body() createManyPhrasesDto: CreateManyPhrasesDto, @GetUser() user: User) {
    return this.phrasesService.createMany(createManyPhrasesDto, user);
  }

  @Get('missing-audio')
  findWithMissingAudio(@GetUser() user: User, @Query() query: GetPhrasesQueryDto) {
    return this.phrasesService.findWithMissingAudio(user, query);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.phrasesService.findAll(user);
  }

  @Get('assessment/random')
  getRandomForAssessment(@GetUser() user: User) {
    return this.phrasesService.getRandomPhraseForAssessment(user);
  }

  @Patch(':id/origin-audio')
  @UseInterceptors(FileInterceptor('file'))
  uploadOriginAudio(
    @Param('id', ParseMongoIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.phrasesService.uploadOriginAudio(id, file);
  }


  @Post('assessment-session')
  createAssessmentSession(@Req() req: any, @Body() createAssessmentDto: CreateAssessmentDto) {
    return this.phrasesService.createAssessmentSession(req.user, createAssessmentDto);
  }
  @Post('deep-study-session')
  createDeepStudySession(@Req() req: any, @Body() createDeepStudyDto: CreateDeepStudyDto) {

    return this.phrasesService.createDeepStudySession(req.user, createDeepStudyDto);
  }

  // relax-session
  @Post('relax-session')
  createRelaxSession(@Body() config: any, @Req() req: any) {
    const user = req.user as User;
    return this.phrasesService.createRelaxSession(user, config);
  }

}