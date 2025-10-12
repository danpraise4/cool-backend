export interface IMaterial {
    id: number;
    category: string;
    icon: string;
    unit: string;
    abbr: string | null;
    price: {
      currency: string;
      amount: number;
    };
  }