import Flutterwave from './flutterwave';

export default class FlutterwaveClient {
  publicKey: string;
  secretKey: string;

  initialize(publicKey: string, secretKey: string) {
    this.publicKey = publicKey;
    this.secretKey = secretKey;
    return this;
  }

  build() {
    return new Flutterwave({
      publicKey: this.publicKey,
      secretKey: this.secretKey,
    });
  }
}
