import { Injectable } from '@nestjs/common';
import { CredentialsService } from '../services/credentials.service';
import { FetchOptions, Hoster, Resource } from '../services/hoster';
import * as request from 'request';

@Injectable()
export class Hoster1Fichier extends Hoster {
  credentials: any;

  constructor(credentials: CredentialsService) {
    super();
    this.credentials = credentials.get('1fichier');
  }

  support(url: string) {
    return /^((https?:)?\/\/)?1fichier\.com\//.test(url);
  }

  async get(url: string, options: FetchOptions = {}) {
    const realUrl = await this.submitForm(url);
    return this.prepareResource(realUrl, options);
  }

  private extractMetadataFromResponse(response) {
    const filename = response.headers['content-disposition'].match(/filename="(.*)"/)[1];
    const length = parseInt(response.headers['content-length']);

    return {
      filename,
      length,
    };
  }

  private prepareResource(realUrl: string, options: FetchOptions = {}) {
    return new Promise<Resource>((resolve, reject) => {
      const headers = options.seek ? { Range: `bytes=${options.seek}-` } : {};
      const req = request({ url: realUrl, headers });

      req.on('response', (response) => {
        const { filename, length } = this.extractMetadataFromResponse(response);
        resolve(new Resource(filename, length, req));
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }

  private submitForm(url: string) {
    return new Promise<string>((resolve, reject) => {
      const req = request({ url, method: 'POST', formData: { did: 0 }});

      req.on('response', (response) => {
        const urlFile = response.headers.location;
        if (urlFile) {
          resolve(urlFile);
        } else {
          reject(new Error('no location header'));
        }
      });

      req.on('error', (error) => {
        reject(error);
      });
    });
  }
}