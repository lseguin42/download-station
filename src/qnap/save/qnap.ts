import * as oldRequest from 'request';

const request = promesify(oldRequest);

export class QnapDownloadStation {
  private sid: string;
  private protocol = 'http';

  constructor(
    private host: string,
  ) {}

  async login(user: string, pass: string) {
    const response = await this.request('Misc/Login', {
      user,
      pass: Buffer.from(pass).toString('base64'),
      // sid: undefined,
    });

    this.sid = response.sid;
  }

  async addUrl(url: string, move: string = 'Qmultimedia/Films', temp: string = 'Qdownload') {
    await this.request('Task/AddUrl', {
      url,
      move,
      temp
    });
  }

  private async request(action: string, formData: any) {
    const url = `${this.protocol}://${this.host}/downloadstation/V4/${action}`;
    const response = await request({
      url,
      method: 'POST',
      formData: {
        ...(this.sid ? { sid: this.sid } : {}),
        ...formData,
      }
    });
    return JSON.parse((response as any).body);
  }
}

function promesify(fn) {
  return (...args) => {
    return new Promise((resolve, reject) => {
      fn(...args, (error, result) => {
        error ? reject(error) : resolve(result);
      });
    });
  };
}
