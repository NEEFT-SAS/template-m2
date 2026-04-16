import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  RECRUITMENT_APPLICATION_CREATED_EVENT,
  RecruitmentApplicationCreatedPayload,
} from '@/contexts/recruitment/domain/events/recruitment-application-created.event';
import { NotificationsService } from '../services/notifications.service';

@Injectable()
export class CreateRecruitmentApplicationNotificationHandler {
  constructor(private readonly notificationsService: NotificationsService) {}

  @OnEvent(RECRUITMENT_APPLICATION_CREATED_EVENT)
  async handle(payload: RecruitmentApplicationCreatedPayload): Promise<void> {
    await this.notificationsService.handleRecruitmentApplicationCreated(payload);
  }
}
