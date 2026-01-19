/***************************
 *
 * Tests: HttpExceptionFilter -> code/message/fields/details
 *
 ***************************/

import { BadRequestException, HttpException, UnauthorizedException } from '@nestjs/common';
import { DomainError } from '../../errors/domain-error';
import { HttpExceptionFilter } from './http-exception.filter';

function createHostMocks(params?: { method?: string; url?: string }) {
  const request = { method: params?.method ?? 'POST', url: params?.url ?? '/test' };

  const response = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn(),
  };

  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
  };

  return { host, response };
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('handles DomainError (no fields)', () => {
    const { host, response } = createHostMocks({ url: '/auth/login' });

    const error = new DomainError({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      statusCode: 401,
    });

    filter.catch(error, host as any);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      fields: undefined,
      details: undefined,
    });
  });

  it('handles DomainError (with fields)', () => {
    const { host, response } = createHostMocks({ url: '/auth/login' });

    const error = new DomainError({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      statusCode: 401,
      fields: {
        email: ['Invalid credentials'],
        password: ['Invalid credentials'],
      },
    });

    filter.catch(error, host as any);

    expect(response.status).toHaveBeenCalledWith(401);
    expect(response.send).toHaveBeenCalledWith({
      code: 'AUTH_INVALID_CREDENTIALS',
      message: 'Invalid credentials',
      fields: {
        email: ['Invalid credentials'],
        password: ['Invalid credentials'],
      },
      details: undefined,
    });
  });

  it('handles validation BadRequestException', () => {
    const { host, response } = createHostMocks({ url: '/auth/register' });

    const error = new BadRequestException({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields: { email: ['invalid'], password: ['too short'] },
    });

    filter.catch(error, host as any);

    expect(response.status).toHaveBeenCalledWith(400);
    expect(response.send).toHaveBeenCalledWith({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      fields: { email: ['invalid'], password: ['too short'] },
      details: undefined,
    });
  });

  it('handles HttpException string response', () => {
    const { host, response } = createHostMocks({ url: '/weird' });

    const error = new HttpException('Nope', 418);

    filter.catch(error, host as any);

    expect(response.status).toHaveBeenCalledWith(418);
    expect(response.send).toHaveBeenCalledWith({
      code: 'HTTP_ERROR',
      message: 'Nope',
      fields: undefined,
      details: undefined,
    });
  });

  it('handles UnauthorizedException', () => {
    const { host, response } = createHostMocks({ url: '/protected' });

    const error = new UnauthorizedException('Missing token');

    filter.catch(error, host as any);

    expect(response.status).toHaveBeenCalledWith(401);

    const payload = (response.send as jest.Mock).mock.calls[0][0];
    expect(payload.code).toBe('UNAUTHORIZED');
    expect(payload.message).toContain('Missing token');
  });

  it('handles unknown error', () => {
    const { host, response } = createHostMocks({ url: '/boom' });

    filter.catch(new Error('Crash'), host as any);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.send).toHaveBeenCalledWith({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Crash',
    });
  });
});
