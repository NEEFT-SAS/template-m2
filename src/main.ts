import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { buildGlobalValidationPipe } from './core/http/validation/validation.pipe';
import { HttpExceptionFilter } from './core/http/exceptions/http-exception.filter';
import { ResponseInterceptor } from './core/http/interceptors/response.interceptor';
import { ConfigService } from '@nestjs/config/dist/config.service';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

    // app.useLogger(new Logger());
  app.use((req, _res, next) => {
    const now = new Date();
    const time = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const date = now.toLocaleDateString('fr-FR');

    console.log(`[API] ${req.method} ${req.originalUrl} lancee le ${date} a ${time}`);
    next();
  });

  app.use(cookieParser(config.get<string>('app.cookieSecret')));

  app.enableCors({
    origin: ['http://localhost:3000', 'https://neeft.fr', 'https://www.neeft.fr'], // Origines autorisées
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Toutes les méthodes HTTP
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'], // Headers autorisés
    credentials: true, // Autorise les cookies et credentials
  })

  app.useGlobalPipes(buildGlobalValidationPipe()); // -> transforme les erreurs DTO en { code, message, fields }
  app.useGlobalFilters(new HttpExceptionFilter()); // -> transforme toutes les erreurs (DomainError, HttpException...) en { code, message, fields?, details? }
  app.useGlobalInterceptors(new ResponseInterceptor()); // -> transforme toutes les reponses OK en { data, meta? }

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
