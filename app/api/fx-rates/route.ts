import { NextResponse } from "next/server";

import { SUPPORTED_CURRENCIES, type SupportedCurrency } from "@/lib/utils/currency";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const FX_ENDPOINT = "https://open.er-api.com/v6/latest/INR";
const FX_REQUEST_TIMEOUT_MS = 5000;

interface CachedRates {
  fetchedAt: number;
  ratesToINR: Record<SupportedCurrency, number>;
}

let cachedRates: CachedRates | null = null;

function isFresh(rates: CachedRates) {
  return Date.now() - rates.fetchedAt < CACHE_TTL_MS;
}

function buildRatesToINR(ratesFromINR: Record<string, unknown>) {
  const ratesToINR = {} as Record<SupportedCurrency, number>;

  for (const currency of SUPPORTED_CURRENCIES) {
    if (currency === "INR") {
      ratesToINR[currency] = 1;
      continue;
    }

    const rateFromINR = ratesFromINR[currency];

    if (typeof rateFromINR !== "number" || !Number.isFinite(rateFromINR) || rateFromINR <= 0) {
      return null;
    }

    ratesToINR[currency] = 1 / rateFromINR;
  }

  return ratesToINR;
}

export async function GET() {
  if (cachedRates && isFresh(cachedRates)) {
    return NextResponse.json(cachedRates);
  }

  try {
    const response = await fetch(FX_ENDPOINT, {
      next: { revalidate: CACHE_TTL_MS / 1000 },
      signal: AbortSignal.timeout(FX_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error("FX request failed");
    }

    const payload = (await response.json()) as { rates?: Record<string, unknown>; result?: string };

    if (payload.result && payload.result !== "success") {
      throw new Error("FX response was not successful");
    }

    const ratesToINR = payload.rates ? buildRatesToINR(payload.rates) : null;

    if (!ratesToINR) {
      throw new Error("FX response was incomplete");
    }

    cachedRates = {
      fetchedAt: Date.now(),
      ratesToINR,
    };

    return NextResponse.json(cachedRates);
  } catch {
    if (cachedRates) {
      return NextResponse.json(cachedRates);
    }

    return NextResponse.json({ error: "Exchange rates unavailable" }, { status: 503 });
  }
}
