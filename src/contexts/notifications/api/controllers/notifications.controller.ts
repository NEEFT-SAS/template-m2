import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { GetNotificationsUseCase } from '../../app/usecases/get-notifications.usecase';
import { GetNotificationsUnreadCountUseCase } from '../../app/usecases/get-notifications-unread-count.usecase';
import { MarkNotificationReadUseCase } from '../../app/usecases/mark-notification-read.usecase';
import { MarkAllNotificationsReadUseCase } from '../../app/usecases/mark-all-notifications-read.usecase';
import { GetNotificationsQueryDto } from '../dtos/get-notifications.query.dto';
import { MockNotificationsDto } from '../dtos/mock-notifications.dto';
import { MockNotificationsUseCase } from '../../app/usecases/mock-notifications.usecase';

type JwtUser = {
  pid?: string;
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('notifications')
@UseGuards(ConnectedGuard)
export class NotificationsController {
  constructor(
    private readonly getNotificationsUseCase: GetNotificationsUseCase,
    private readonly getNotificationsUnreadCountUseCase: GetNotificationsUnreadCountUseCase,
    private readonly markNotificationReadUseCase: MarkNotificationReadUseCase,
    private readonly markAllNotificationsReadUseCase: MarkAllNotificationsReadUseCase,
    private readonly mockNotificationsUseCase: MockNotificationsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  getNotifications(
    @Req() req: RequestWithUser,
    @Query() query: GetNotificationsQueryDto,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getNotificationsUseCase.execute(requesterProfileId, query);
  }

  @Get('unread-count')
  @HttpCode(HttpStatus.OK)
  getUnreadCount(@Req() req: RequestWithUser) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getNotificationsUnreadCountUseCase.execute(requesterProfileId);
  }

  @Post(':notificationId/read')
  @HttpCode(HttpStatus.OK)
  markRead(
    @Req() req: RequestWithUser,
    @Param('notificationId') notificationId: string,
  ) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.markNotificationReadUseCase.execute(
      requesterProfileId,
      notificationId,
    );
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@Req() req: RequestWithUser) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.markAllNotificationsReadUseCase.execute(requesterProfileId);
  }

  @Post('mock')
  @HttpCode(HttpStatus.CREATED)
  mockNotifications(
    @Req() req: RequestWithUser,
    @Body() body: MockNotificationsDto,
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    if (isProd) {
      throw new ForbiddenException(
        'Mock notifications endpoint is disabled in production',
      );
    }

    const requesterProfileId = req.user?.pid ?? '';
    return this.mockNotificationsUseCase.execute(requesterProfileId, body ?? {});
  }
}
