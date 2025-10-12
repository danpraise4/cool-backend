//  Flutterwave
import config from "../config/app.config";
import Flutterwave from "./flutterwave/flutterwave";
import { CardInput } from "./flutterwave/flutterwave.interface";

export class PaymentService {
  private flutterwave: Flutterwave;

  constructor() {
    this.flutterwave = new Flutterwave({
      publicKey: config.FLUTTERWAVE.PUBLIC_KEY,
      secretKey: config.FLUTTERWAVE.SECRET_KEY,
    });
  }

  async createPayment(config: CardInput) {
    const response = await this.flutterwave.chargeCard(config);
    return response;
  }
}
