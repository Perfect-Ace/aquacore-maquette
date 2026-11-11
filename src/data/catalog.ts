import type { Driver, Market, Product } from "./types";

export const PORT = "Port d'Agadir";
/** Port position on the route board (same coordinate space as the markets). */
export const PORT_XY = { x: 78, y: 272 };

export const PRODUCTS: Product[] = [
  { id: "sardine", name: "Sardine", buy: 9, sell: 14, hue: "bg-sky-100 text-sky-800" },
  { id: "anchois", name: "Anchois", buy: 12, sell: 18, hue: "bg-cyan-100 text-cyan-800" },
  { id: "maquereau", name: "Maquereau", buy: 14, sell: 21, hue: "bg-teal-100 text-teal-800" },
  { id: "merlan", name: "Merlan", buy: 32, sell: 45, hue: "bg-indigo-100 text-indigo-800" },
  { id: "dorade", name: "Dorade", buy: 55, sell: 75, hue: "bg-amber-100 text-amber-800" },
  { id: "sole", name: "Sole", buy: 85, sell: 115, hue: "bg-orange-100 text-orange-800" },
  { id: "crevette", name: "Crevette", buy: 70, sell: 95, hue: "bg-rose-100 text-rose-800" },
  { id: "calamar", name: "Calamar", buy: 60, sell: 82, hue: "bg-violet-100 text-violet-800" },
  { id: "poulpe", name: "Poulpe", buy: 65, sell: 88, hue: "bg-fuchsia-100 text-fuchsia-800" },
  { id: "thon", name: "Thon", buy: 40, sell: 58, hue: "bg-blue-100 text-blue-800" },
];

export const DRIVERS: Driver[] = [
  { id: "d1", name: "Hassan Ait Brahim", phone: "06 61 23 45 67", truck: "34521-A-9" },
  { id: "d2", name: "Youssef El Idrissi", phone: "06 62 98 11 02", truck: "18842-B-9" },
  { id: "d3", name: "Rachid Ouhmad", phone: "06 70 45 66 13", truck: "50217-A-9" },
  { id: "d4", name: "Mustapha Bennani", phone: "06 55 31 72 84", truck: "27605-D-9" },
  { id: "d5", name: "Abdellah Zahiri", phone: "06 48 90 12 37", truck: "41130-A-9" },
];

/** x / y: schematic position on the route board (not a real map). */
export const MARKETS: Market[] = [
  { id: "marrakech", name: "Marché de Marrakech", city: "Marrakech", km: 250, hours: 3.5, x: 178, y: 170 },
  { id: "casablanca", name: "Marché de Casablanca", city: "Casablanca", km: 470, hours: 5.5, x: 196, y: 58 },
  { id: "benimellal", name: "Marché de Béni Mellal", city: "Béni Mellal", km: 450, hours: 6, x: 286, y: 120 },
  { id: "fes", name: "Marché de Fès", city: "Fès", km: 760, hours: 9, x: 352, y: 42 },
  { id: "essaouira", name: "Marché d'Essaouira", city: "Essaouira", km: 175, hours: 2.5, x: 62, y: 172 },
];

export const product = (id: string) => PRODUCTS.find((p) => p.id === id)!;
export const driver = (id: string) => DRIVERS.find((d) => d.id === id)!;
export const market = (id: string) => MARKETS.find((m) => m.id === id)!;

/** Fish older than this many days on the market is lost. */
export const FRESH_DAYS = 3;
