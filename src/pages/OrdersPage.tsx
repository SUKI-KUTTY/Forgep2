import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock, PackageCheck, Truck } from 'lucide-react';
import { BoutiqueImage } from '../components/BoutiqueImage';
import { fetchMyOrders } from '../lib/api';
import { formatDate, formatINR } from '../lib/format';
import type { AuthUser, Order, OrderStatus } from '../types/boutique';

interface OrdersPageProps {
  user: AuthUser | null;
  onOpenAuth: () => void;
  onBackToStore: () => void;
}

const STATUS_CONFIG: Record<
  OrderStatus,
  { icon: typeof Clock; label: string; colorClass: string }
> = {
  Pending: {
    icon: Clock,
    label: 'Pending Verification',
    colorClass: 'text-[#8A6914] bg-[#C59B27]/15 border-[#C59B27]/40',
  },
  Confirmed: {
    icon: CheckCircle2,
    label: 'Confirmed',
    colorClass: 'text-[#6B1D2F] bg-[#6B1D2F]/10 border-[#6B1D2F]/30',
  },
  Shipped: {
    icon: Truck,
    label: 'Shipped',
    colorClass: 'text-[#1E4E68] bg-[#1E4E68]/10 border-[#1E4E68]/30',
  },
  Delivered: {
    icon: PackageCheck,
    label: 'Delivered',
    colorClass: 'text-[#215A36] bg-[#215A36]/10 border-[#215A36]/30',
  },
};

export function OrdersPage({ user, onOpenAuth, onBackToStore }: OrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchMyOrders(user.id)
      .then((data) => {
        if (!cancelled) setOrders(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load orders');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-10 lg:py-14 min-h-[70vh]">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E5DCCB]">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B1D2F] hover:underline mb-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Back to Collections</span>
          </button>
          <h1 className="font-serif text-3xl font-semibold text-[#1E1B18]">My Orders</h1>
          <p className="text-xs text-[#5C544D]">
            Track your silk weaves, handcrafted Aari orders, and delivery status.
          </p>
        </div>
      </div>

      {!user ? (
        <div className="mt-10 p-10 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/40 space-y-4">
          <p className="font-serif text-xl text-[#1E1B18]">Sign in to view your order history</p>
          <p className="text-xs text-[#5C544D] max-w-md mx-auto">
            Access your saved delivery addresses, UPI references, and live shipment updates.
          </p>
          <button
            type="button"
            onClick={onOpenAuth}
            className="px-6 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
          >
            Sign In / Create Account
          </button>
        </div>
      ) : loading ? (
        <div className="mt-8 space-y-4">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="h-44 rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/50 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="mt-8 p-6 border border-[#6B1D2F]/30 bg-[#6B1D2F]/5 rounded-lg text-sm text-[#6B1D2F]">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-10 p-10 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/30 space-y-4">
          <p className="font-serif text-xl text-[#1E1B18]">No orders placed yet</p>
          <p className="text-xs text-[#5C544D]">
            When you place a bridal silk or couture order, it will appear here with tracking updates.
          </p>
          <button
            type="button"
            onClick={onBackToStore}
            className="px-5 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
          >
            Explore Collections
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order) => {
            const statusCfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.Pending;
            const StatusIcon = statusCfg.icon;

            return (
              <article
                key={order.id}
                className="border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] overflow-hidden"
              >
                {/* Order Header */}
                <div className="px-5 py-4 bg-[#F2ECE1]/70 border-b border-[#E5DCCB] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
                    <div>
                      <span className="text-[#5C544D]">Order ID: </span>
                      <span className="font-mono font-semibold text-[#1E1B18]">{order.id}</span>
                    </div>
                    <div>
                      <span className="text-[#5C544D]">Placed: </span>
                      <span className="font-medium text-[#1E1B18] tabular-nums">
                        {formatDate(order.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[#5C544D]">Total: </span>
                      <span className="font-bold text-[#1E1B18] tabular-nums">
                        {formatINR(order.total_amount)}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold border rounded-md ${statusCfg.colorClass}`}
                  >
                    <StatusIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{statusCfg.label}</span>
                  </div>
                </div>

                {/* Ordered Items & Shipping Details */}
                <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={`${item.product_id}-${item.size}-${idx}`}
                        className="flex items-center gap-4"
                      >
                        <div className="w-16 h-16 rounded-md overflow-hidden border border-[#E5DCCB] bg-[#F2ECE1] shrink-0">
                          <BoutiqueImage
                            src={item.image_url}
                            alt={item.name}
                            fallbackTitle={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-serif text-sm font-semibold text-[#1E1B18] truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-[#5C544D]">
                            Size: {item.size} · Qty: {item.quantity}
                          </p>
                        </div>
                        <p className="text-sm font-semibold tabular-nums text-[#1E1B18] shrink-0">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="lg:col-span-5 lg:border-l lg:border-[#E5DCCB] lg:pl-6 space-y-3 text-xs">
                    <div>
                      <p className="font-semibold text-[#1E1B18] mb-1">Delivery Address</p>
                      <p className="text-[#5C544D] leading-relaxed">
                        {order.customer_name} ({order.customer_phone})
                        <br />
                        {order.shipping_address}
                        <br />
                        {order.city} — {order.pincode}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-[#1E1B18] mb-0.5">Payment</p>
                      <p className="text-[#5C544D]">
                        {order.payment_method}
                        {order.upi_transaction_id && (
                          <span className="font-mono text-[#1E1B18]">
                            {' '}
                            · Ref: {order.upi_transaction_id}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
