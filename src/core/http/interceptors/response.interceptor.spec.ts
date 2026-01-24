/*
#########################
# Tests: ResponseInterceptor -> { data } / preserve { data, meta }
#########################
*/

import { CallHandler } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  const makeContext = (method = 'GET') =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ method }),
      }),
    }) as any;

  it('wraps object into { data }', async () => {
    const body = { id: 1, username: 'Kenan' };
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept(makeContext(), next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: body });
  });

  it('wraps array into { data }', async () => {
    const body = [{ id: 1 }, { id: 2 }];
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept(makeContext(), next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: body });
  });

  it('wraps null into { data }', async () => {
    const next: CallHandler = { handle: () => of(null) };

    const result$ = interceptor.intercept(makeContext(), next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: null });
  });

  it('wraps null into { data: { deleted: true } } for DELETE', async () => {
    const next: CallHandler = { handle: () => of(null) };

    const result$ = interceptor.intercept(makeContext('DELETE'), next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: { deleted: true } });
  });

  it('forces { data: { deleted: true } } for DELETE even with body', async () => {
    const next: CallHandler = { handle: () => of({ id: 1 }) };

    const result$ = interceptor.intercept(makeContext('DELETE'), next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: { deleted: true } });
  });

  it('preserves { data: { deleted: true }, meta } for DELETE', async () => {
    const body = { data: { deleted: true }, meta: { traceId: 'abc' } };
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept(makeContext('DELETE'), next);
    const result = await firstValueFrom(result$);

    expect(result).toBe(body);
  });

  it('preserves { data, meta }', async () => {
    const body = { data: { id: 1 }, meta: { total: 10 } };
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept(makeContext(), next);
    const result = await firstValueFrom(result$);

    expect(result).toBe(body);
  });
});
