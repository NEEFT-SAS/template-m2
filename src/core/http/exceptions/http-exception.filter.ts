import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DomainError } from '../../errors/domain-error';

type ApiErrorBody = {
  code: string;
  message: string;
  fields?: Record<string, string[]>;
  details?: unknown;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<any>();
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

  private log(statusCode: number, method: string, path: string, code: string, message: string, exception: unknown) {
    const line = `[${method}] ${path} -> ${statusCode} ${code}: ${message}`;

    if (statusCode >= 500) {
      this.logger.error(line, (exception as any)?.stack);
    } else {
      this.logger.warn(line);
    }
  }
}