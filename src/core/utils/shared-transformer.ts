import { createRequire } from 'module';
import type { ClassConstructor, ClassTransformOptions } from 'class-transformer';

type SharedTransformer = typeof import('class-transformer');

const sharedTransformer: SharedTransformer = (() => {
  try {
    const sharedRequire = createRequire(require.resolve('@neeft-sas/shared'));
    return sharedRequire('class-transformer') as SharedTransformer;
  } catch {
    return require('class-transformer') as SharedTransformer;
  }
})();

export function plainToSharedInstance<T, V>(
  cls: ClassConstructor<T>,
  plain: V[],
  options?: ClassTransformOptions,
): T[];
export function plainToSharedInstance<T, V>(
  cls: ClassConstructor<T>,
  plain: V,
  options?: ClassTransformOptions,
): T;
export function plainToSharedInstance<T, V>(
  cls: ClassConstructor<T>,
  plain: V | V[],
  options?: ClassTransformOptions,
): T | T[] {
  return sharedTransformer.plainToInstance(cls, plain, options);
}
