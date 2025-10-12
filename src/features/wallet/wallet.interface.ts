export interface ICard {
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  fullname: string;
  currency: string;
  amount: number;
}

export interface IBank {
  amount: number;
  email: string;
  currency: string;
  tx_ref: string;
  is_permanent: boolean;
}
