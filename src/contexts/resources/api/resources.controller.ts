import { Controller, Get } from '@nestjs/common';
import { GetResourcesUseCase } from '../app/usecases/get-resources.usecase';

@Controller('resources')
export class ResourcesController {
  constructor(private readonly getResources: GetResourcesUseCase) {}

  @Get()
  async getAll() {
    const snapshot = await this.getResources.execute();

    return {
      data: {
        rscCountries: snapshot.rscCountries,
        rscLanguages: snapshot.rscLanguages,
        rscSocialPlatforms: snapshot.rscSocialPlatforms,
        rscProfileBadges: snapshot.rscProfileBadges,
      },
      meta: {
        version: snapshot.version,
      },
    };
  }
}