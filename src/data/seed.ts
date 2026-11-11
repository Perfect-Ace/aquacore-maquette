import { DAY, HOUR, startOfDay } from "@/lib/format";
import { seeded } from "@/lib/utils";
import { DRIVERS, MARKETS, PRODUCTS, market, product } from "./catalog";
import type { Bon, Loss, Sale, Shipment } from "./types";

/**
 * Demo data: one year of closed trips (for the charts) + today's live situation
 * (trucks loading, on the road, selling). Same data on every load of the same day.
 */
export function generateDemo(now = Date.now()): Bon[] {
  const rnd = seeded(Math.floor(now / DAY));
  const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;
  const between = (a: number, b: number) => a + rnd() * (b - a);
  const round = (n: number, step = 5) => Math.max(step, Math.round(n / step) * step);
  let seq = 1;
  let idSeq = 1;
  const id = (p: string) => `${p}${idSeq++}`;
  const bons: Bon[] = [];
  const today = startOfDay(now);

  /** Sales over 3 days, the rest lost on day 3. */
  function simulateMarket(s: Shipment, bonLines: Bon["lines"], days: number, upTo: number) {
    const lossRate = between(0.01, 0.08);
    for (const line of s.lines) {
      const p = product(line.productId);
      const price = bonLines.find((l) => l.productId === line.productId)!.price;
      const toSell = line.kg * (1 - lossRate);
      const shares = [between(0.4, 0.55), between(0.25, 0.35)];
      shares.push(1 - shares[0]! - shares[1]!);
      const arrivalDay = startOfDay(s.arrivedAt!);
      const firstHour = Math.max(8, (s.arrivedAt! - arrivalDay) / HOUR + 0.5);
      for (let d = 0; d < 3; d++) {
        // Market days are calendar days: day 1 is the arrival day.
        const from = d === 0 ? firstHour : 7;
        const at = arrivalDay + d * DAY + (from + rnd() * Math.max(0.5, 19 - from)) * HOUR;
        if (d >= days || at > upTo) break;
        const qty = Math.round(toSell * shares[d]! * 10) / 10;
        if (qty <= 0) continue;
        const unit = Math.max(price * 1.05, p.sell * between(0.92, 1.12));
        s.sales.push({ id: id("v"), at, productId: p.id, kg: qty, amount: Math.round(qty * unit) });
      }
      const lossAt = arrivalDay + 2 * DAY + 19.5 * HOUR;
      const lost = Math.round(line.kg * lossRate * 10) / 10;
      if (days >= 3 && lossAt <= upTo && lost > 0.5) {
        s.losses.push({ id: id("p"), at: lossAt, productId: p.id, kg: lost, photo: rnd() < 0.5 ? "demo" : undefined });
      }
    }
  }

  function makeBon(at: number, products: { id: string; kg: number }[]): Bon {
    return {
      id: id("b"),
      number: "",
      at,
      port: "Port d'Agadir",
      lines: products.map((x) => {
        const p = product(x.id);
        return { productId: p.id, kg: x.kg, price: Math.round(p.buy * between(0.85, 1.15) * 2) / 2 };
      }),
      shipments: [],
    };
  }

  function ship(bon: Bon, driverId: string, marketId: string, share: number | null, loadedAt: number): Shipment {
    const m = market(marketId);
    return {
      id: id("s"),
      driverId,
      marketId,
      transport: Math.round((m.km * between(2.6, 3.2)) / 50) * 50,
      lines: bon.lines.map((l) => ({ productId: l.productId, kg: share === null ? l.kg : Math.round(l.kg * share) })),
      loadedAt,
      sales: [],
      losses: [],
    };
  }

  /* ── One year of history (closed trips) ── */
  for (let d = 365; d >= 4; d--) {
    const dayStart = today - d * DAY;
    const date = new Date(dayStart);
    const season = 1 + 0.25 * Math.sin(((date.getMonth() + 1) / 12) * Math.PI * 2);
    const count = date.getDay() === 5 ? 1 : rnd() < 0.25 ? 2 : 1; // calmer on Fridays
    for (let c = 0; c < count; c++) {
      const at = dayStart + (5.3 + rnd() * 1.4 + c * 0.6) * HOUR;
      const n = 2 + Math.floor(rnd() * 3);
      const chosen = [...PRODUCTS].sort(() => rnd() - 0.5).slice(0, n);
      const bon = makeBon(
        at,
        chosen.map((p) => ({ id: p.id, kg: round((p.buy < 20 ? between(120, 420) : between(25, 140)) * season) })),
      );
      const totalKg = bon.lines.reduce((a, l) => a + l.kg, 0);
      const split = totalKg > 700;
      const trucks = split ? [0.55, 0.45] : [null];
      trucks.forEach((share, i) => {
        const s = ship(bon, pick(DRIVERS).id, pick(MARKETS).id, share, at + 20 * 60_000);
        s.departedAt = s.loadedAt + (25 + i * 10) * 60_000;
        s.arrivedAt = s.departedAt + market(s.marketId).hours * HOUR * between(0.95, 1.15);
        simulateMarket(s, bon.lines, 3, now);
        s.closedAt = s.arrivedAt + 2 * DAY + 12 * HOUR;
        bon.shipments.push(s);
      });
      bons.push(bon);
    }
  }

  /* ── Today's live situation ── */
  // Day 3 at Fès: fish at risk, losses with photos.
  const b1 = makeBon(today - 2 * DAY + 5.6 * HOUR, [
    { id: "sardine", kg: 300 },
    { id: "dorade", kg: 60 },
    { id: "calamar", kg: 45 },
  ]);
  const s1 = ship(b1, "d5", "fes", null, b1.at + 20 * 60_000);
  s1.departedAt = s1.loadedAt + 30 * 60_000;
  s1.arrivedAt = s1.departedAt + 9.2 * HOUR;
  simulateMarket(s1, b1.lines, 2, now); // its losses are added just below, with photos
  s1.losses.push(
    { id: id("p"), at: now - 3 * HOUR, productId: "sardine", kg: 12, photo: "demo" },
    { id: id("p"), at: now - 2 * HOUR, productId: "calamar", kg: 3.5, photo: "demo" },
  );
  b1.shipments.push(s1);

  // Day 2 at Marrakech.
  const b2 = makeBon(today - DAY + 5.8 * HOUR, [
    { id: "anchois", kg: 180 },
    { id: "merlan", kg: 70 },
    { id: "crevette", kg: 35 },
    { id: "poulpe", kg: 40 },
  ]);
  const s2 = ship(b2, "d4", "marrakech", null, b2.at + 20 * 60_000);
  s2.departedAt = s2.loadedAt + 25 * 60_000;
  s2.arrivedAt = s2.departedAt + 3.6 * HOUR;
  simulateMarket(s2, b2.lines, 2, now);
  b2.shipments.push(s2);

  // This morning: a big purchase split over 2 trucks, both on the road.
  const b3 = makeBon(now - 3.2 * HOUR, [
    { id: "sardine", kg: 600 },
    { id: "anchois", kg: 250 },
    { id: "maquereau", kg: 150 },
    { id: "sole", kg: 40 },
  ]);
  const s3a = ship(b3, "d1", "marrakech", 0.5, b3.at + 15 * 60_000);
  s3a.departedAt = now - 2.4 * HOUR;
  const s3b = ship(b3, "d2", "casablanca", 0.5, b3.at + 15 * 60_000);
  s3b.departedAt = now - 2.1 * HOUR;
  b3.shipments.push(s3a, s3b);

  bons.push(b1, b2, b3);
  bons.sort((a, b) => a.at - b.at);
  for (const b of bons) b.number = `B-${String(seq++).padStart(4, "0")}`;
  return bons.reverse();
}

export type { Sale, Loss };
