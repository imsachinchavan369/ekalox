import {
  SUPPORTED_CURRENCIES,
  type SupportedCurrency,
} from "@/lib/utils/currency";

const STORAGE_KEY = "ekalox-display-fx-rates";
const MAX_CLIENT_CACHE_AGE_MS = 12 * 60 * 60 * 1000;

export interface DisplayExchangeRates {
  fetchedAt: number;
  ratesToINR: Record<SupportedCurrency, number>;
}

let cachedRates: DisplayExchangeRates | null = null;
let pendingRates: Promise<DisplayExchangeRates | null> | null = null;

function isRatesRecord(value: unknown): value is Record<SupportedCurrency, number> {
  if (!value || typeof value !== "object") {
    return false;
  }

  return SUPPORTED_CURRENCIES.every((currency) => {
    const rate = (value as Partial<Record<SupportedCurrency, unknown>>)[currency];
    return typeof rate === "number" && Number.isFinite(rate) && rate > 0;
  });
}

function normalizeRates(value: unknown): DisplayExchangeRates | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<DisplayExchangeRates>;

  if (typeof candidate.fetchedAt !== "number" || !isRatesRecord(candidate.ratesToINR)) {
    return null;
  }

  return {
    fetchedAt: candidate.fetchedAt,
    ratesToINR: candidate.ratesToINR,
  };
}

function getStoredRates() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? normalizeRates(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

function setStoredRates(rates: DisplayExchangeRates) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
  } catch {
    // Storage is best-effort; price display can still render without approximation.
  }
}

function isFresh(rates: DisplayExchangeRates) {
  return Date.now() - rates.fetchedAt < MAX_CLIENT_CACHE_AGE_MS;
}

export function getCachedDisplayExchangeRates() {
  if (cachedRates) {
    return cachedRates;
  }

  const storedRates = getStoredRates();
  cachedRates = storedRates;
  return storedRates;
}

export async function loadDisplayExchangeRates() {
  const currentRates = getCachedDisplayExchangeRates();

  if (currentRates && isFresh(currentRates)) {
    return currentRates;
  }

  if (!pendingRates) {
    pendingRates = fetch("/api/fx-rates", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return currentRates;
        }

        const rates = normalizeRates(await response.json());

        if (!rates) {
          return currentRates;
        }

        cachedRates = rates;
        setStoredRates(rates);
        return rates;
      })
      .catch(() => currentRates)
      .finally(() => {
        pendingRates = null;
      });
  }

  return pendingRates;
}

export function convertDisplayCurrency(
  amount: number,
  fromCurrency: SupportedCurrency,
  toCurrency: SupportedCurrency,
  rates: DisplayExchangeRates | null,
) {
  if (!Number.isFinite(amount) || amount <= 0 || !rates) {
    return null;
  }

  if (fromCurrency === toCurrency) {
    return amount;
  }

  const fromRate = rates.ratesToINR[fromCurrency];
  const toRate = rates.ratesToINR[toCurrency];

  if (!Number.isFinite(fromRate) || !Number.isFinite(toRate) || fromRate <= 0 || toRate <= 0) {
    return null;
  }

  return (amount * fromRate) / toRate;
}
