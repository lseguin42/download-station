import { Injectable } from '@nestjs/common';
import { Download } from '../models/download.model';
import { HostManager } from './host-manager.service';
import * as bytes from 'bytes';
import { writeFileSync, readFileSync } from 'fs';

const DOWNLOAD_FILE = './downloads.json';

@Injectable()
export class DownloadManager {
  private max: number = 5;
  private downloads: Download[] = [];

  constructor (
    private hostManager: HostManager,
  ) {
    this.restoreDownloads();
  }

  download(url: string, destination: string) {
    this.add(this.makeDownload(url, destination));
  }

  getAll() {
    return this.downloads;
  }

  private makeDownload(url: string, destination: string, status: string = 'pending') {
    return new Download({
      hoster: this.hostManager.getPreferredHostFor(url),
      url,
      destination,
      status
    });
  }

  private restoreDownloads() {
    try {
      JSON.parse(readFileSync(DOWNLOAD_FILE).toString())
        .forEach(({ url, destination, status = 'pending' }) => {
          if (status === 'progress') {
            status = 'interrupt';
          }
          this.add(this.makeDownload(url, destination, status));
        });
    } catch (e) {
      console.log(e);
    }
  }

  private add(download: Download) {
    this.downloads.push(download);

    download
      .on('start', () => this.saveDownloads())
      .on('end', () => this.manageDownloads())
      .on('error', () => this.manageDownloads())
      .on('progress', (progress) => console.log('progress', progress));

    this.manageDownloads();
  }

  private saveDownloads() {
    const downloads = this.downloads.map((download) => {
      return {
        destination: download.destination,
        url: download.url,
        status: download.status,
      };
    });

    writeFileSync(DOWNLOAD_FILE, JSON.stringify(downloads));
  }

  inProgress() {
    return this.downloads.filter((download) => download.status === 'progress');
  }

  private manageDownloads() {
    for (let i = 0; i < this.downloads.length && this.inProgress().length < this.max; i++) {
      const download = this.downloads[i];
      if (download.status === 'pending') {
        download.start();
      } else if (download.status === 'interrupt' || download.status === 'error') {
        download.resume();
      }
    }
    this.saveDownloads();
  }
}
