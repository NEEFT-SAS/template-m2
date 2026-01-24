import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Typesense from 'typesense';

@Injectable()
export class TypesenseService {
  private readonly logger = new Logger(TypesenseService.name);

  readonly client: Typesense.Client;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('TYPESENSE_HOST') ?? 'localhost';
    const port = Number(this.config.get<string>('TYPESENSE_PORT') ?? 8108);
    const protocol = this.config.get<string>('TYPESENSE_PROTOCOL') ?? 'http';
    const apiKey = this.config.get<string>('TYPESENSE_API_KEY') ?? '';

    if (!apiKey) {
      this.logger.warn('Typesense API key missing (TYPESENSE_API_KEY)');
    }

    this.client = new Typesense.Client({
      nodes: [{ host, port, protocol }],
      apiKey,
      connectionTimeoutSeconds: 2,
    });
  }
}
