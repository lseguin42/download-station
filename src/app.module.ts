import { Module } from '@nestjs/common';
import { DownloaderController } from './qnap/controllers/downloader.controller';
import { CredentialsService } from './qnap/services/credentials.service';
import { DownloadManager } from './qnap/services/download-manager.service';
import { HostManager } from './qnap/services/host-manager.service';
import { Hoster1Fichier } from './qnap/hosters/1fichier.hoster';

@Module({
  controllers: [DownloaderController],
  providers: [CredentialsService, DownloadManager, HostManager, Hoster1Fichier],
})
export class AppModule {}
