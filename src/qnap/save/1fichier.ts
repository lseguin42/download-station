import { Observable } from 'rxjs';
import * as request from 'request';

export function get1Fichier(url: string): Promise<string> {
  return Observable.create((observer) => {
    const req = request({ url, method: 'POST', formData: { did: 0 }});

    req.on('response', (response) => {
      const urlFile = response.headers.location;
      if (urlFile) {
        observer.next(urlFile);
        observer.complete();
      } else {
        observer.error(new Error('no location header'));
      }
    });

    req.on('error', (error) => {
      observer.error(error);
    });

    return () => {
      req.abort();
    };
  }).toPromise();
}