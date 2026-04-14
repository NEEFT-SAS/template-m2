import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { DomainError } from '../../errors/domain-error';
import { EVENT_BUS, EventBusPort } from '@/core/events/event-bus.port';
import { Request } from 'express';
import { InternalServerErrorEvent, InternalServerErrorEventPayload } from '../events/internal-server-error.event';

type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  details?: unknown;
};
type RequestWithUser = Request & { user?: { slug: string, pid: string, sub: string, username: string} };

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  constructor(
    @Inject(EVENT_BUS) private readonly eventBus: EventBusPort
  ) {}
 
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<RequestWithUser>();
    const response = ctx.getResponse<any>();

    const method = request?.method ?? 'UNKNOWN';
    const path = request?.url ?? request?.originalUrl ?? 'UNKNOWN';

    // 1) Domain errors (DDD)
    if (exception instanceof DomainError) {
      const payload: ApiErrorBody = {
        code: exception.code,
        message: exception.message,
        fields: exception.fields,
        details: exception.details,
      };

      this.log(exception.statusCode, method, path, payload.code, payload.message, exception);

      return response.status(exception.statusCode).send(payload);
    }

    // 2) Nest HttpException
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const raw = exception.getResponse();
      const normalized = this.normalizeHttpException(raw, statusCode);

      if(statusCode >= 500) {
        this.sendInternalServerErrorEvent({
          method,
          path,
          code: normalized.code,
          message: normalized.message,
          request,
          authenticated: !!request.user,
          userProfileId: request.user?.pid || '',
          userProfileSlug: request.user?.slug || ''
        });
      }

      const payload: ApiErrorBody = {
        code: normalized.code,
        message: normalized.message,
        fields: normalized.fields,
        details: normalized.details,
      };

      this.log(statusCode, method, path, payload.code, payload.message, exception);

      return response.status(statusCode).send(payload);
    }

    // 3) Unknown error -> 500
    const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

    const payload: ApiErrorBody = {
      code: 'INTERNAL_SERVER_ERROR',
      message: (exception as any)?.message ?? 'Unexpected error',
    };

    this.sendInternalServerErrorEvent({
      method,
      path,
      code: payload.code,
      message: payload.message,
      request,
      authenticated: !!request.user,
      userProfileId: request.user?.pid || '',
      userProfileSlug: request.user?.slug || ''
    });

    this.log(statusCode, method, path, payload.code, payload.message, exception);

    return response.status(statusCode).send(payload);
  }

  private normalizeHttpException(raw: any, statusCode: number): { code: string; message: string; fields?: any; details?: any } {
    if (raw && typeof raw === 'object') {
      const code = raw.code ?? this.defaultCodeForStatus(statusCode);
      const message = Array.isArray(raw.message) ? raw.message.join(', ') : String(raw.message ?? 'Request failed');

      return {
        code,
        message,
        fields: raw.fields,
        details: raw.details,
      };
    }

    if (typeof raw === 'string') {
      return {
        code: this.defaultCodeForStatus(statusCode),
        message: raw,
      };
    }

    return {
      code: this.defaultCodeForStatus(statusCode),
      message: 'Request failed',
    };
  }

  private defaultCodeForStatus(statusCode: number) {
    if (statusCode === 400) return 'BAD_REQUEST';
    if (statusCode === 401) return 'UNAUTHORIZED';
    if (statusCode === 403) return 'FORBIDDEN';
    if (statusCode === 404) return 'NOT_FOUND';
    if (statusCode === 409) return 'CONFLICT';
    if (statusCode === 422) return 'UNPROCESSABLE_ENTITY';
    if (statusCode === 429) return 'TOO_MANY_REQUESTS';
    return 'HTTP_ERROR';
  }

  private sendInternalServerErrorEvent(payload: InternalServerErrorEventPayload) {
    this.eventBus.publish(InternalServerErrorEvent.create(payload));
  }

  private log(statusCode: number, method: string, path: string, code: string, message: string, exception: unknown) {
    const line = `[${method}] ${path} -> ${statusCode} ${code}: ${message}`;

    if (statusCode >= 500) {
      this.logger.error(line, (exception as any)?.stack);
    } else {
      this.logger.warn(line);
    }
  }
}