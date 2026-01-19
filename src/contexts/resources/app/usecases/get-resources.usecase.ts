import { Injectable } from '@nestjs/common';
import { ResourcesStore } from '../../infra/cache/resources.store';

@Injectable()
export class GetResourcesUseCase {
  constructor(private readonly store: ResourcesStore) {}

  async execute() {
    return this.store.getSnapshot();
  }
}