
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UserLoginDto, UserRegisterDto } from '@neeft-sas/shared';
import { UserRegisterUsecase } from '../app/usecases/register.usecase';
import { UserLoginUsecase } from '../app/usecases/login.usecase';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUseCase: UserRegisterUsecase,
    private readonly loginUseCase: UserLoginUsecase
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
}