"use client";

import { useEffect, useMemo, useState } from "react";

import { CurrencySelector } from "@/components/common/CurrencySelector";
import type { ReelProductCard } from "@/lib/uploads/queries";
import { DEFAULT_CURRENCY, normalizeCurrency, type SupportedCurrency } from "@/lib/utils/currency";

import { ProductCard } from "./ProductCard";

interface ProductBrowserProps {
  products: ReelProductCard[];
}

const CATEGORIES = [
  "All",
  "AI",
  "Prompts",
  "Music",
  "Video",
  "Design",
  "Graphics",
  "Templates",
  "Presets",
  "Websites",
  "Code",
  "Apps",
  "Courses",
  "Ebooks",
  "Marketing",
  "Social Media",
  "Productivity",
  "Business",
] as const;

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase().replace(/_/g, " ");
}

function getProductCategory(product: ReelProductCard) {
  const productWithCategory = product as ReelProductCard & { category?: string | null };
  return productWithCategory.category ?? "";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        d="m20 20-4.4-4.4M10.8 18a7.2 7.2 0 1 1 0-14.4 7.2 7.2 0 0 1 0 14.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.9"
      />
    </svg>
  );
}

export function ProductBrowser({ products }: ProductBrowserProps) {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [displayCurrency, setDisplayCurrency] = useState<SupportedCurrency>(DEFAULT_CURRENCY);

  useEffect(() => {
    setDisplayCurrency(normalizeCurrency(window.localStorage.getItem("ekalox-display-currency")));
  }, []);

  const handleDisplayCurrencyChange = (currency: SupportedCurrency) => {
    setDisplayCurrency(currency);
    window.localStorage.setItem("ekalox-display-currency", currency);
    window.dispatchEvent(new Event("ekalox:display-currency"));
  };

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalize(query);
    const normalizedCategory = normalize(selectedCategory);

    return products.filter((product) => {
      const category = getProductCategory(product);
      const matchesCategory = selectedCategory === "All" || normalize(category) === normalizedCategory;
      const matchesQuery =
        !normalizedQuery ||
        normalize(product.title).includes(normalizedQuery) ||
        normalize(product.creatorName).includes(normalizedQuery) ||
        normalize(category).includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [products, query, selectedCategory]);

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 pb-4 sm:pb-6">
      <header className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/12 text-xs font-black text-cyan-100">
                E
              </span>
              <span className="text-sm font-black tracking-[0.18em] text-cyan-200">EKALOX</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">Products</h1>
            <p className="mt-1 max-w-xl text-sm font-medium text-slate-400">
              Browse premium digital products from reel-first creators.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 lg:max-w-lg">
            <label className="flex h-12 w-full items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.055] px-3 text-slate-400 shadow-lg shadow-black/12 transition focus-within:border-cyan-300/40 focus-within:bg-white/[0.075]">
              <SearchIcon />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search products, creators, categories"
                className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white placeholder:text-slate-500 focus:outline-none"
                type="search"
              />
            </label>
            <div className="flex justify-start lg:justify-end">
              <CurrencySelector value={displayCurrency} onChange={handleDisplayCurrencyChange} />
            </div>
          </div>
        </div>

        <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
          <div className="flex snap-x gap-2 pb-1 lg:flex-wrap">
            {CATEGORIES.map((category) => {
              const isActive = category === selectedCategory;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(category)}
                  className={`snap-start whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold transition active:scale-95 ${
                    isActive
                      ? "border-cyan-300/70 bg-cyan-300 text-slate-950 shadow-[0_8px_22px_rgba(103,232,249,0.2)]"
                      : "border-white/10 bg-white/[0.045] text-slate-300 hover:border-white/18 hover:bg-white/[0.07]"
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {filteredProducts.length === 0 ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/72 p-5 text-sm text-slate-400">
          No products match this search.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 min-[400px]:grid-cols-2 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.productId} displayCurrency={displayCurrency} product={product} />
          ))}
        </ul>
      )}
    </section>
  );
}
