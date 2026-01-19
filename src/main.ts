import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildGlobalValidationPipe } from './core/http/validation/validation.pipe';
import { HttpExceptionFilter } from './core/http/exceptions/http-exception.filter';
import { ResponseInterceptor } from './core/http/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(buildGlobalValidationPipe()); // -> transforme les erreurs DTO en { code, message, fields }
  app.useGlobalFilters(new HttpExceptionFilter()); // -> transforme toutes les erreurs (DomainError, HttpException...) en { code, message, fields?, details? }
  app.useGlobalInterceptors(new ResponseInterceptor()); // -> transforme toutes les reponses OK en { data, meta? }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
