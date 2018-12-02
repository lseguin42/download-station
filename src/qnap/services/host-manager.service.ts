import { Injectable } from '@nestjs/common';
import { Download } from '../models/download.model';
import { Hoster } from './hoster';
import { Hoster1Fichier } from '../hosters/1fichier.hoster';

@Injectable()
export class HostManager {
  private hosters: Hoster[] = [];

  constructor (
    hoster1Fichier: Hoster1Fichier,
  ) {
    this.hosters.push(hoster1Fichier);
  }

  getPreferredHostFor(url: string) {
    return this.hosters.find((hoster) => hoster.support(url));
  }
}