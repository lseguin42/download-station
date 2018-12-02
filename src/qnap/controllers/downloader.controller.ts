import { Get, Controller, Param, Post, Put, Body } from '@nestjs/common';
import { DownloadManager } from '../services/download-manager.service';

@Controller()
export class DownloaderController {
  constructor(private readonly downloadManager: DownloadManager) {}

  @Get('v1/downloads')
  all() {
    return this.downloadManager.getAll()
      .map((download) => {
        return {
          url: download.url,
          destination: download.destination,
          status: download.status,
          speed: download.getSpeed(),
          ...download.getProgress()
        };
      });
  }

  @Get('v1/downloads/:id')
  details(@Param('id') id: string) {

  }


  @Post('v1/downloads')
  add(@Body() data: any) {
    this.downloadManager.download(data.url, data.destination || '/share/Qdownload');
  }

  @Put('v1/downloads/:id')
  edit(@Param('id') id: string) {

  }
}
