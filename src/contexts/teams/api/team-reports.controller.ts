import { Body, Controller, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { CreateProfileReportUseCase } from '@/contexts/players/app/usecases/reports/create-profile-report.usecase';
import { CreateProfileReportDto } from '@/contexts/players/api/dtos/create-profile-report.dto';

type JwtUser = {
  slug: string;
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('teams')
export class TeamReportsController {
  constructor(
    private readonly createProfileReportUseCase: CreateProfileReportUseCase,
  ) {}

  @Post(':slug/report')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  createReport(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: CreateProfileReportDto) {
    const reporterSlug = req.user?.slug ?? '';
    return this.createProfileReportUseCase.execute(reporterSlug, 'team', slug, body);
  }
}
