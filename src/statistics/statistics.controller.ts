// src/statistics/statistics.controller.ts
import { Controller, Post, Body, UseGuards, Req, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { UpdateStatsDto } from './dto/update-stats.dto';
import { User } from 'src/auth/schemas/user.schema';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';

@Controller('statistics')
@UseGuards(AuthGuard())
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) { }

  @Post()
  updateUserStats(@Body() updateStatsDto: UpdateStatsDto, @Req() req: any) {
    const user = req.user as User;
    const { phraseId, isCorrect } = updateStatsDto;
    return this.statisticsService.updateStats(user, phraseId, isCorrect);
  }

  @Post('deep-study/:phraseId')
  incrementDeepStudy(@Req() req: any, @Param('phraseId', ParseMongoIdPipe) phraseId: string) {
    return this.statisticsService.incrementDeepStudyCount(req.user, phraseId);
  }
}