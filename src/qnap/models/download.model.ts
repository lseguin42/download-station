import { Hoster, Resource } from '../services/hoster';
import { EventEmitter } from 'events';
import { join } from 'path';
import { createWriteStream, stat, exists, WriteStream, Stats } from 'fs';
import * as bytes from 'bytes';

interface DownloadOptions {
  hoster: Hoster,
  url: string,
  destination: string,
  status?: string,
}

interface EventError extends Error {}

interface EventEnd {
  downloaded: number;
}

interface EventResume {
  filename: string;
  size: number;
  destination: string;
  downloaded: number;
}

interface EventStart {
  filename: string;
  size: number;
  destination: string;
}

interface EventProgress {
  currentSize: number;
  totalSize: number;
}

export class Download {
  private hoster: Hoster;
  public url: string;
  public destination: string;
  public status: string;
  private internalEmitter = new EventEmitter();
  private currentSize: number = 0;
  private totalSize: number = 0;

  private lastStartDate: number;
  private lastStartSize: number;

  constructor(options: DownloadOptions) {
    this.hoster = options.hoster;
    this.url = options.url;
    this.destination = options.destination;
    this.status = options.status || 'pending';
  }

  private emit(eventName: 'error', error: EventError)
  private emit(eventName: 'end', data: EventEnd)
  private emit(eventName: 'resume', data: EventResume)
  private emit(eventName: 'start', data: EventStart)
  private emit(eventName: 'progress', data: EventProgress)
  private emit(eventName: 'end' | 'start' | 'resume' | 'error' | 'progress', value: any) {
    return this.internalEmitter.emit(eventName, value);
  }

  on(eventName: 'error', callback: (error: EventError) => void)
  on(eventName: 'end', callback: (data: EventEnd) => void)
  on(eventName: 'resume', callback: (data: EventResume) => void)
  on(eventName: 'start', callback: (data: EventStart) => void)
  on(eventName: 'progress', callback: (data: EventProgress) => void)
  on(eventName: 'end' | 'start' | 'resume' | 'error' | 'progress', callback: (data: any) => void) {
    this.internalEmitter.on(eventName, callback);
    return this;
  }

  private getDestinationStats() {
    return new Promise<Stats>((resolve, reject) => {
      stat(this.destination, (error, stats) => {
        if (error) {
          return reject(error);
        }
        resolve(stats);
      });
    });
  }

  getProgress() {
    return {
      currentSize: this.currentSize,
      totalSize: this.totalSize,
      percent: this.currentSize / this.totalSize,
    };
  }

  getSpeed() {
    const diff = (Date.now() - this.lastStartDate) / 1000;
    return (this.currentSize - this.lastStartSize) / diff;
  }

  async exists(file) {
    return new Promise<boolean>((resolve) => {
      exists(file, resolve);
    });
  }

  async addSuffixFile(file) {
    const matches = file.match(/^(.*)(\.[^\.]*)$/);
    const filename = matches ? matches[1] : file;
    const ext = matches ? matches[2] : '';

    let exists = false;
    let suffix = '';
    let suffixNumber = 0;
    let lastFilename: string;

    do {
      lastFilename = `${filename}${suffix}${ext}`;
      exists = await this.exists(lastFilename);
      suffixNumber++;
      suffix = ` (${suffixNumber})`;
    } while (exists);

    return lastFilename;
  }

  async start() {
    this.status = 'progress';
    const stats = await this.getDestinationStats();
    const resource = await this.hoster.get(this.url);
    this.currentSize = 0;

    if (stats.isDirectory()) {
      this.destination = await this.addSuffixFile(join(this.destination, resource.filename));
    }

    this.store(resource);

    this.emit('start', {
      filename: resource.filename,
      destination: this.destination,
      size: resource.size,
    });
  }

  async resume() {
    this.status = 'progress';
    const stats = await this.getDestinationStats();
    if (stats.isDirectory()) {
      return this.start();
    }
    this.currentSize = stats.size;
    const resource = await this.hoster.get(this.url, { seek: this.currentSize });

    this.store(resource, {
      flags: 'a',
      encoding: null
    });

    this.emit('resume', {
      filename: resource.filename,
      destination: this.destination,
      size: resource.size,
      downloaded: this.currentSize,
    });
  }

  private store(resource: Resource, streamOptions?: any) {
    this.lastStartDate = Date.now();
    this.lastStartSize = this.currentSize;
    this.totalSize = resource.size;

    resource
      .stream
      .on('data', (chunk) => {
        this.currentSize += chunk.length;
        this.emit('progress', {
          currentSize: this.currentSize,
          totalSize: this.totalSize,
        });
      })
      .on('end', () => {
        this.status = 'end';
        this.emit('end', {
          downloaded: this.currentSize
        });
      })
      .on('error', (error) => {
        this.status = 'error';
        this.emit('error', error);
      })
      .pipe(createWriteStream(this.destination, streamOptions));
  }
}
