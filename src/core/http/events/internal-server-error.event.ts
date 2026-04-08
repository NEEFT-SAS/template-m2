import { Request } from "express"
import { timestamp } from "rxjs";

type RequestWithUser = Request & { user?: { slug: string, pid: string, sub: string, username: string} };

export type InternalServerErrorEventPayload = {
    method: string
    path: string
    code: string
    message: string
    request: RequestWithUser
    authenticated: boolean
    userProfileId: string
    userProfileSlug: string
    timestamp?: Date
  }

export const INTERNAL_SERVER_ERROR_EVENT = 'internal.server.error';

export class InternalServerErrorEvent {
  static eventName = INTERNAL_SERVER_ERROR_EVENT
  static create(payload: InternalServerErrorEventPayload) {
    return {
      name: InternalServerErrorEvent.eventName,
      payload: {...payload, timestamp: new Date()}
    }
  }
}
