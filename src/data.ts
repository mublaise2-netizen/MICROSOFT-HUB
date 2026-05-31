import { InvestmentProduct } from './types';

export const products: InvestmentProduct[] = [
  {
    id: 1,
    name: "Microsoft Surface Go",
    planName: "GAHUNDA Y'IBANZE",
    imageUrl: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 6000,
    dailyIncome: 1250,
    durationDays: 30,
    totalIncome: 37500
  },
  {
    id: 2,
    name: "Microsoft Surface Laptop",
    planName: "GAHUNDA ISANZWE",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 15000,
    dailyIncome: 3200,
    durationDays: 30,
    totalIncome: 96000
  },
  {
    id: 3,
    name: "Microsoft Surface Pro",
    planName: "GAHUNDA ISUMBUYE",
    imageUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 35000,
    dailyIncome: 7500,
    durationDays: 30,
    totalIncome: 225000
  },
  {
    id: 4,
    name: "Microsoft Xbox Series S",
    planName: "GAHUNDA PREMIUM",
    imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 60000,
    dailyIncome: 13500,
    durationDays: 30,
    totalIncome: 405000
  },
  {
    id: 5,
    name: "Microsoft Xbox Series X",
    planName: "GAHUNDA VIP",
    imageUrl: "https://images.unsplash.com/photo-1621259182978-f09e5e2b07ae?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 90000,
    dailyIncome: 19500,
    durationDays: 30,
    totalIncome: 585000
  },
  {
    id: 6,
    name: "Microsoft Surface Studio",
    planName: "GAHUNDA VVIP",
    imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 150000,
    dailyIncome: 32500,
    durationDays: 30,
    totalIncome: 975000
  },
  {
    id: 7,
    name: "Microsoft HoloLens",
    planName: "GAHUNDA YA NYUMA",
    imageUrl: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=400&q=80",
    investmentAmount: 200000,
    dailyIncome: 42500,
    durationDays: 30,
    totalIncome: 1275000
  }
];

export const mockTickerMessages = [
  "Konti Irimo Gukora: MH***989 yakiriye inyungu ya buri munsi ingana na 32,500 Frw muri GAHUNDA VVIP.",
  "Konti MH***490 imaze kubitsa 15,000 Frw kuri konti yayo.",
  "Konti MH***812 imaze kubikuza 45,000 Frw neza.",
  "Konti MH***703 imaze gushora imari muri Microsoft Surface Pro (GAHUNDA ISUMBUYE).",
  "Konti MH***251 imaze kubitsa 200,000 Frw no gushora muri Microsoft HoloLens.",
  "Konti MH***332 yafashe inyungu ya 120,500 Frw kuri MTN Mobile Money.",
  "Konti MH***989 yakuye 32,500 Frw y'inyungu kuri GAHUNDA VVIP.",
  "Konti MH***612 yongeyeho 35,000 Frw kuri Airtel Money.",
  "Konti MH***144 yabikuje 585,000 Frw neza rwose!"
];
