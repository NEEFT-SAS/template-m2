
import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto } from '@neeft-sas/shared';
import { UserRegisterUsecase } from '../app/usecases/register.usecase';
import { UserLoginUsecase } from '../app/usecases/login.usecase';
import { ConnectedGuard } from '../infra/guards/connected.guard';
import { GetUserSessionUseCase } from '../app/usecases/session.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: UserRegisterUsecase,
    private readonly loginUseCase: UserLoginUsecase,
    private readonly getUserSessionUseCase: GetUserSessionUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  register(@Body() dto: UserRegisterDto) {
    return this.registerUseCase.execute(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: UserLoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Get('session')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  me(@Req() req: any) {
    return this.getUserSessionUseCase.execute(req.user.sub);
  }

}