import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { PlayerOwnerOrAdminGuard } from '../infra/guards/player-owner-or-admin.guard';
import { CreatePlayerStaffRoleUseCase } from '../app/usecases/staff-roles/create-player-staff-role.usecase';
import { GetPlayerStaffRolesUseCase } from '../app/usecases/staff-roles/get-player-staff-roles.usecase';
import { GetPlayerStaffRoleUseCase } from '../app/usecases/staff-roles/get-player-staff-role.usecase';
import { UpdatePlayerStaffRoleUseCase } from '../app/usecases/staff-roles/update-player-staff-role.usecase';
import { DeletePlayerStaffRoleUseCase } from '../app/usecases/staff-roles/delete-player-staff-role.usecase';
import {
  CreatePlayerStaffRoleDTO,
  UpdatePlayerStaffRoleDTO,
} from './dtos/player-staff-role.dto';

@Controller('players')
export class PlayerStaffRolesController {
  constructor(
    private readonly createPlayerStaffRoleUseCase: CreatePlayerStaffRoleUseCase,
    private readonly getPlayerStaffRolesUseCase: GetPlayerStaffRolesUseCase,
    private readonly getPlayerStaffRoleUseCase: GetPlayerStaffRoleUseCase,
    private readonly updatePlayerStaffRoleUseCase: UpdatePlayerStaffRoleUseCase,
    private readonly deletePlayerStaffRoleUseCase: DeletePlayerStaffRoleUseCase,
  ) {}

  @Post(':slug/staff-roles')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  createPlayerStaffRole(
    @Param('slug') slug: string,
    @Body() body: CreatePlayerStaffRoleDTO,
  ) {
    return this.createPlayerStaffRoleUseCase.execute(slug, body);
  }

  @Get(':slug/staff-roles')
  @HttpCode(HttpStatus.OK)
  getPlayerStaffRoles(@Param('slug') slug: string) {
    return this.getPlayerStaffRolesUseCase.execute(slug);
  }

  @Get(':slug/staff-roles/:roleId')
  @HttpCode(HttpStatus.OK)
  getPlayerStaffRole(@Param('slug') slug: string, @Param('roleId') roleId: string) {
    return this.getPlayerStaffRoleUseCase.execute(slug, roleId);
  }

  @Patch(':slug/staff-roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  updatePlayerStaffRole(
    @Param('slug') slug: string,
    @Param('roleId') roleId: string,
    @Body() body: UpdatePlayerStaffRoleDTO,
  ) {
    return this.updatePlayerStaffRoleUseCase.execute(slug, roleId, body);
  }

  @Delete(':slug/staff-roles/:roleId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard, PlayerOwnerOrAdminGuard)
  async deletePlayerStaffRole(
    @Param('slug') slug: string,
    @Param('roleId') roleId: string,
  ) {
    await this.deletePlayerStaffRoleUseCase.execute(slug, roleId);
    return { deleted: true };
  }
}
