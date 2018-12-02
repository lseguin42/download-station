import { Module } from '@nestjs/common';
import { DownloaderController } from './controllers/downloader.controller';
import { CredentialsService } from './services/credentials.service';
import { DownloadManager } from './services/download-manager.service';
import { HostManager } from './services/host-manager.service';
import { Hoster1Fichier } from './hosters/1fichier.hoster';

@Module({
  imports: [],
  controllers: [DownloaderController],
  providers: [CredentialsService, DownloadManager, HostManager, Hoster1Fichier],
})
export class DownloaderModule {}
