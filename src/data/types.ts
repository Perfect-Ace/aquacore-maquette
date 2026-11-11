export type Product = {
  id: string;
  name: string;
  /** Typical port price, DH/kg (used to prefill and to generate the demo). */
  buy: number;
  /** Typical market price, DH/kg. */
  sell: number;
  hue: string;
};

export type Driver = { id: string; name: string; phone: string; truck: string };

export type Market = { id: string; name: string; city: string; km: number; hours: number; x: number; y: number };

export type Sale = { id: string; at: number; productId: string; kg: number; amount: number };

/** `photo`: a data URL (real photo from the phone) or a demo illustration key. */
export type Loss = { id: string; at: number; productId: string; kg: number; photo?: string };

/** One truck's part of a bon: its goods, its trip, what was sold and lost. */
export type Shipment = {
  id: string;
  driverId: string;
  marketId: string;
  transport: number;
  lines: { productId: string; kg: number }[];
  loadedAt: number;
  departedAt?: number;
  arrivedAt?: number;
  closedAt?: number;
  sales: Sale[];
  losses: Loss[];
};

/** Purchase at the port. Can be split over several trucks. */
export type Bon = {
  id: string;
  number: string;
  at: number;
  port: string;
  lines: { productId: string; kg: number; price: number }[];
  shipments: Shipment[];
};

export type Stage = "loaded" | "road" | "market" | "done";
