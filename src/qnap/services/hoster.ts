import { Stream } from 'stream';
import { Injectable } from '@nestjs/common';

export interface FetchOptions {
  seek?: number;
}

export class Resource {
  constructor(
    public filename: string,
    public size: number,
    public stream: Stream,
  ) {}
}

@Injectable()
export abstract class Hoster {
  abstract support(url: string): boolean;
  abstract get(url: string, options?: FetchOptions): Promise<Resource> | Resource;
}
