import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class NotificationsRealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToProfile(profileId: string, event: string, payload: unknown) {
    if (!this.server || !profileId) return;
    this.server.to(this.profileRoom(profileId)).emit(event, payload);
  }

  profileRoom(profileId: string) {
    return `notifications:user:${profileId}`;
  }
}
