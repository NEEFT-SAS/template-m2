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

  it('wraps object into { data }', async () => {
    const body = { id: 1, username: 'Kenan' };
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept({} as any, next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: body });
  });

  it('wraps array into { data }', async () => {
    const body = [{ id: 1 }, { id: 2 }];
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept({} as any, next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: body });
  });

  it('wraps null into { data }', async () => {
    const next: CallHandler = { handle: () => of(null) };

    const result$ = interceptor.intercept({} as any, next);
    const result = await firstValueFrom(result$);

    expect(result).toEqual({ data: null });
  });

  it('preserves { data, meta }', async () => {
    const body = { data: { id: 1 }, meta: { total: 10 } };
    const next: CallHandler = { handle: () => of(body) };

    const result$ = interceptor.intercept({} as any, next);
    const result = await firstValueFrom(result$);

    expect(result).toBe(body);
  });
});
