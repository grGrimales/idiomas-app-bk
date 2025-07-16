// src/statistics/statistics.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { UpdateStatsDto } from './dto/update-stats.dto';
import { User } from 'src/auth/schemas/user.schema';

@Controller('statistics')
@UseGuards(AuthGuard())
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Post()
  updateUserStats(@Body() updateStatsDto: UpdateStatsDto, @Req() req: any) {
    const user = req.user as User;
    const { phraseId, isCorrect } = updateStatsDto;
    return this.statisticsService.updateStats(user, phraseId, isCorrect);
  }
}