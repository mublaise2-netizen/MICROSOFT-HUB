export interface InvestmentProduct {
  id: number;
  name: string;
  planName: string;
  imageUrl: string;
  investmentAmount: number;
  dailyIncome: number;
  durationDays: number;
  totalIncome: number;
}

export interface UserState {
  balance: number;
  totalDeposit: number;
  totalWithdraw: number;
  accountNumber: string;
}

export interface ActiveInvestment {
  id: string; // unique transaction id
  productId: number;
  name: string;
  planName: string;
  investmentAmount: number;
  dailyIncome: number;
  purchasedAt: string; // ISO date string
  durationDays: number;
  lastClaimedAt: string; // ISO string of last automated or manual claims
  earningsClaimed: number; // accumulated claimed money
}

export interface Transaction {
  id: string;
  type: 'deposit' | 'withdraw' | 'invest' | 'claim';
  amount: number;
  status: 'pending' | 'success' | 'failed';
  method?: string; // MTN Mobile Money / Airtel Money
  details?: string;
  createdAt: string;
}
