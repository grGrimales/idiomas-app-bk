import { BadRequestException, Controller, Get } from '@nestjs/common';
import { SeedService } from './seed.service';

@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  executeSeed() {


  

    // ejecutar si la url contine localhost
      if (!process.env.HOST?.includes('localhost')) {
        throw new BadRequestException('No se puede ejecutar la siembra en este entorno');
      }

    return this.seedService.populateDB();
  }
}