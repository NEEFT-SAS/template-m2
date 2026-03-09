import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class MessagingRealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToProfile(profileId: string, event: string, payload: unknown) {
    if (!this.server || !profileId) return;
    this.server.to(this.profileRoom(profileId)).emit(event, payload);
  }

  emitToProfiles(profileIds: string[], event: string, payload: unknown) {
    if (!this.server || !profileIds.length) return;

    const uniqueIds = Array.from(new Set(profileIds.filter(Boolean)));
    uniqueIds.forEach((profileId) => {
      this.emitToProfile(profileId, event, payload);
    });
  }

  profileRoom(profileId: string) {
    return `messaging:user:${profileId}`;
  }
}
