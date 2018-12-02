import { QnapDownloadStation } from './qnap';
import { get1Fichier } from './1fichier';

const { QNAP_HOST, QNAP_LOGIN, QNAP_PASSWORD } = process.env;

async function bootstrap() {
  const qnapDownloadStation = new QnapDownloadStation(QNAP_HOST);
  await qnapDownloadStation.login(QNAP_LOGIN, QNAP_PASSWORD);

  const urls = await Promise.all(process.argv.slice(2).map(get1Fichier));

  for (const url of urls) {
    await qnapDownloadStation.addUrl(url);
  }
}

function usage() {
  console.log('usage: env QNAP_HOST, QNAP_LOGIN, QNAP_PASSWORD should be setted.');
}

if (!QNAP_HOST || !QNAP_LOGIN || !QNAP_PASSWORD) {
  usage();
  process.exit(1);
} else {
  bootstrap();
}
