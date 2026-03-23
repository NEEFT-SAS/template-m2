import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { SearchRecruitmentsUseCase } from '../../app/usecases/search-recruitments.usecase';
import { GetRecruitmentUseCase } from '../../app/usecases/get-recruitment.usecase';
import { CreateRecruitmentUseCase } from '../../app/usecases/create-recruitment.usecase';
import { UpdateRecruitmentUseCase } from '../../app/usecases/update-recruitment.usecase';
import { DeleteRecruitmentUseCase } from '../../app/usecases/delete-recruitment.usecase';
import { CreateRecruitmentDto } from '../dtos/create-recruitment.dto';

type JwtUser = {
  pid: string;
  slug: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('recruitments')
export class RecruitmentController {
  constructor(
    private readonly searchRecruitments: SearchRecruitmentsUseCase,
    private readonly getRecruitment: GetRecruitmentUseCase,
    private readonly createRecruitment: CreateRecruitmentUseCase,
    private readonly updateRecruitment: UpdateRecruitmentUseCase,
    private readonly deleteRecruitment: DeleteRecruitmentUseCase,
  ) { }

  @Get()
  search(@Query() query: any) {
    return this.searchRecruitments.execute(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.getRecruitment.execute(id);
  }

  @Post('teams/:teamId')
  @UseGuards(ConnectedGuard)
  create(
    @Req() req: RequestWithUser,
    @Param('teamId') teamId: string,
    @Body() dto: CreateRecruitmentDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.createRecruitment.execute(requesterProfileId, teamId, dto);
  }

  @Patch(':id')
  @UseGuards(ConnectedGuard)
  update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateRecruitmentDto>,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.updateRecruitment.execute(requesterProfileId, id, dto);
  }

  @Delete(':id')
  @UseGuards(ConnectedGuard)
  delete(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.deleteRecruitment.execute(requesterProfileId, id);
  }
}
