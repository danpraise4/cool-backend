export interface IFlutterwaveBaseResponse<T> {
  status: string;
  message: string;
  data: T;
}

export interface CardInput {
  card_number: string;
  cvv: string;
  expiry_month: string;
  expiry_year: string;
  currency: string;
  amount: string;
  email: string;
  fullname?: string;
  tx_ref: string;
  redirect_url?: string;
}


export interface CreateCardChargeInput {
  tx_ref: string;
  amount: string;
  currency: string;
  redirect_url: string;
  customer: {
    email: string;
    name: string;
  };
  customizations: {
    title: string;
  };
}