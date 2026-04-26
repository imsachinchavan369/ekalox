import { OrderCard } from "@/components/profile/OrderCard";

import type { ProfileOrderItem } from "./types";

interface MyOrdersSectionProps {
  orders: ProfileOrderItem[];
}

export function MyOrdersSection({ orders }: MyOrdersSectionProps) {
  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-cyan-300">Library</p>
        <h2 className="text-lg font-bold text-white">My Orders</h2>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 text-sm text-slate-400">
          Downloaded and purchased products will appear here.
        </p>
      ) : (
        <ul className="grid gap-3 xl:grid-cols-2">
          {orders.map((order) => (
            <OrderCard
              key={`${order.productId}-${order.orderType}`}
              order={order}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
