import { Injectable } from '@nestjs/common';

@Injectable()
export class CredentialsService {
  private credentials = new Map<string, any>();

  constructor() {
    this.credentials.set('1fichier', {
      login: '',
      password: ''
    });
  }

  get(key: string) {
    return this.credentials.get(key);
  }
}