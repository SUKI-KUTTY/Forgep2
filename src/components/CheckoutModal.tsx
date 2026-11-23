import { useEffect, useState, type FormEvent } from 'react';
import { CheckCircle2, QrCode, Truck, X } from 'lucide-react';
import { createOrder } from '../lib/api';
import { formatINR } from '../lib/format';
import { BOUTIQUE_UPI_ID } from '../lib/supabase';
import type {
  AuthUser,
  CartItem,
  Order,
  PaymentMethod,
  Profile,
} from '../types/boutique';

interface CheckoutModalProps {
  open: boolean;
  items: CartItem[];
  user: AuthUser | null;
  profile: Profile | null;
  onClose: () => void;
  onOrderSuccess: (order: Order, updatedProfile: Partial<Profile>) => void;
  onViewMyOrders: () => void;
}

export function CheckoutModal({
  open,
  items,
  user,
  profile,
  onClose,
  onOrderSuccess,
  onViewMyOrders,
}: CheckoutModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doorNo, setDoorNo] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [pincode, setPincode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [upiTransactionId, setUpiTransactionId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (open && profile) {
      setCustomerName(profile.full_name || '');
      setCustomerPhone(profile.phone || '');
      setCity(profile.city || '');
      setPincode(profile.pincode || '');
      if (profile.saved_address && !doorNo && !street) {
        setStreet(profile.saved_address);
      }
    }
    if (!open) {
      setConfirmedOrder(null);
      setError(null);
    }
  }, [open, profile]);

  if (!open || !user) return null;

  const totalAmount = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (paymentMethod === 'UPI' && !upiTransactionId.trim()) {
      setError('Please enter your UPI Transaction / UTR Reference ID after completing payment.');
      return;
    }

    const addressParts = [
      doorNo.trim(),
      street.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : '',
      district.trim() && district.trim().toLowerCase() !== city.trim().toLowerCase()
        ? `${district.trim()} Dist.`
        : '',
    ].filter(Boolean);

    const shippingAddress = addressParts.join(', ');

    setSubmitting(true);
    try {
      const order = await createOrder({
        user_id: user.id,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        shipping_address: shippingAddress,
        city: city.trim(),
        pincode: pincode.trim(),
        items: items.map((item) => ({
          product_id: item.product.id,
          name: item.product.name,
          category: item.product.category,
          price: item.product.price,
          size: item.size,
          quantity: item.quantity,
          image_url: item.product.image_url,
        })),
        total_amount: totalAmount,
        payment_method: paymentMethod,
        upi_transaction_id: paymentMethod === 'UPI' ? upiTransactionId.trim() : null,
      });

      setConfirmedOrder(order);
      onOrderSuccess(order, {
        full_name: customerName.trim(),
        phone: customerPhone.trim(),
        saved_address: shippingAddress,
        city: city.trim(),
        pincode: pincode.trim(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1E1B18]/50 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="Checkout and Delivery Details"
    >
      <div className="w-full max-w-2xl bg-[#FAF7F2] border border-[#E5DCCB] rounded-lg shadow-2xl my-8 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#E5DCCB] flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[#6B1D2F]">Kaveri Silks Checkout</p>
            <h2 className="font-serif text-2xl font-semibold text-[#1E1B18]">
              {confirmedOrder ? 'Order Confirmed' : 'Delivery Address & Payment'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close checkout"
            className="p-1.5 text-[#5C544D] hover:text-[#1E1B18] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {confirmedOrder ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-start gap-4 p-4 rounded-md bg-[#F2ECE1] border border-[#E5DCCB]">
              <CheckCircle2 className="w-6 h-6 text-[#6B1D2F] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-serif text-lg font-semibold text-[#1E1B18]">
                  Order #{confirmedOrder.id} Confirmed — Preparing Shipment
                </p>
                <p className="text-xs text-[#5C544D]">
                  Thank you, {confirmedOrder.customer_name}. Our atelier team will verify your
                  order and send dispatch tracking updates to {confirmedOrder.customer_phone}.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs border border-[#E5DCCB] rounded-md p-4">
              <div>
                <p className="font-semibold text-[#1E1B18] mb-1">Deliver To</p>
                <p className="text-[#5C544D] leading-relaxed">
                  {confirmedOrder.customer_name}
                  <br />
                  {confirmedOrder.shipping_address}
                  <br />
                  {confirmedOrder.city} — {confirmedOrder.pincode}
                </p>
              </div>
              <div>
                <p className="font-semibold text-[#1E1B18] mb-1">Payment Summary</p>
                <p className="text-[#5C544D]">
                  Method: <span className="font-medium text-[#1E1B18]">{confirmedOrder.payment_method}</span>
                </p>
                {confirmedOrder.upi_transaction_id && (
                  <p className="text-[#5C544D]">
                    UPI Ref: <span className="font-mono text-[#1E1B18]">{confirmedOrder.upi_transaction_id}</span>
                  </p>
                )}
                <p className="text-[#1E1B18] font-bold text-sm tabular-nums mt-1">
                  Total: {formatINR(confirmedOrder.total_amount)}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#5C544D] border border-[#E5DCCB] rounded-md hover:border-[#6B1D2F] cursor-pointer"
              >
                Continue Shopping
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewMyOrders();
                }}
                className="px-5 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
              >
                View My Orders
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
            {error && (
              <div className="p-3 text-xs font-medium text-[#6B1D2F] bg-[#6B1D2F]/10 border border-[#6B1D2F]/30 rounded-md">
                {error}
              </div>
            )}

            {/* Order Items Summary */}
            <div className="p-4 rounded-md bg-[#F2ECE1]/70 border border-[#E5DCCB] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1E1B18]">
                <span>Order Items ({items.reduce((s, i) => s + i.quantity, 0)})</span>
                <span className="tabular-nums text-sm">{formatINR(totalAmount)}</span>
              </div>
              <div className="space-y-1">
                {items.map((item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex items-center justify-between text-xs text-[#5C544D]"
                  >
                    <span className="truncate pr-3">
                      {item.product.name} ({item.size}) × {item.quantity}
                    </span>
                    <span className="tabular-nums shrink-0">
                      {formatINR(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient & Address Details */}
            <div className="space-y-4">
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Shipping Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Recipient Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Mobile Number (for Delivery &amp; WhatsApp)
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Door No. / Flat
                  </label>
                  <input
                    type="text"
                    required
                    value={doorNo}
                    onChange={(e) => setDoorNo(e.target.value)}
                    placeholder="No. 14, Villa 2"
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Street / Colony / Area
                  </label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="East Masi Street, Mylapore"
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Landmark
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Kapaleeshwarar Tank"
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    City / Town
                  </label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Chennai"
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    District / State
                  </label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Tamil Nadu"
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="600004"
                    className="w-full px-3 py-2 text-sm tabular-nums bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4 pt-2 border-t border-[#E5DCCB]">
              <h3 className="font-serif text-base font-semibold text-[#1E1B18]">
                Payment Method
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`flex items-center gap-3 p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'UPI'
                      ? 'border-[#6B1D2F] bg-[#6B1D2F]/5'
                      : 'border-[#E5DCCB] hover:border-[#6B1D2F]/50'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-[#6B1D2F] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#1E1B18]">Instant UPI Transfer</p>
                    <p className="text-[11px] text-[#5C544D]">GPay, PhonePe, Paytm, BHIM</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-center gap-3 p-3.5 rounded-md border text-left transition-colors cursor-pointer ${
                    paymentMethod === 'COD'
                      ? 'border-[#6B1D2F] bg-[#6B1D2F]/5'
                      : 'border-[#E5DCCB] hover:border-[#6B1D2F]/50'
                  }`}
                >
                  <Truck className="w-5 h-5 text-[#6B1D2F] shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[#1E1B18]">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-[#5C544D]">Pay at doorstep upon inspection</p>
                  </div>
                </button>
              </div>

              {paymentMethod === 'UPI' ? (
                <div className="p-4 rounded-md border border-[#E5DCCB] bg-[#F2ECE1]/60 flex flex-col sm:flex-row gap-5 items-center">
                  {/* Boutique UPI QR Graphic */}
                  <div className="p-3 bg-white border border-[#E5DCCB] rounded-md shrink-0 text-center">
                    <svg
                      viewBox="0 0 120 120"
                      className="w-28 h-28 text-[#1E1B18]"
                      aria-label="Boutique UPI QR Code"
                    >
                      <rect width="120" height="120" fill="#FFFFFF" />
                      {/* Finder squares */}
                      <rect x="8" y="8" width="32" height="32" fill="none" stroke="#1E1B18" strokeWidth="6" />
                      <rect x="17" y="17" width="14" height="14" fill="#6B1D2F" />
                      <rect x="80" y="8" width="32" height="32" fill="none" stroke="#1E1B18" strokeWidth="6" />
                      <rect x="89" y="17" width="14" height="14" fill="#6B1D2F" />
                      <rect x="8" y="80" width="32" height="32" fill="none" stroke="#1E1B18" strokeWidth="6" />
                      <rect x="17" y="89" width="14" height="14" fill="#6B1D2F" />
                      {/* Data pattern */}
                      <rect x="48" y="12" width="8" height="8" fill="#1E1B18" />
                      <rect x="62" y="12" width="10" height="8" fill="#1E1B18" />
                      <rect x="48" y="28" width="14" height="8" fill="#1E1B18" />
                      <rect x="12" y="48" width="12" height="8" fill="#1E1B18" />
                      <rect x="32" y="52" width="12" height="12" fill="#1E1B18" />
                      <rect x="52" y="48" width="16" height="16" fill="#6B1D2F" />
                      <rect x="76" y="48" width="10" height="10" fill="#1E1B18" />
                      <rect x="94" y="52" width="14" height="8" fill="#1E1B18" />
                      <rect x="48" y="74" width="12" height="12" fill="#1E1B18" />
                      <rect x="68" y="74" width="10" height="18" fill="#1E1B18" />
                      <rect x="86" y="80" width="22" height="10" fill="#1E1B18" />
                      <rect x="48" y="96" width="18" height="12" fill="#1E1B18" />
                      <rect x="82" y="98" width="14" height="12" fill="#1E1B18" />
                    </svg>
                    <p className="text-[11px] font-mono font-medium text-[#1E1B18] mt-1.5">
                      {BOUTIQUE_UPI_ID}
                    </p>
                  </div>

                  <div className="flex-1 w-full space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-[#1E1B18]">
                        Scan QR or transfer {formatINR(totalAmount)} to{' '}
                        <span className="font-mono text-[#6B1D2F]">{BOUTIQUE_UPI_ID}</span>
                      </p>
                      <p className="text-[11px] text-[#5C544D] mt-0.5">
                        Enter the 12-digit UPI / UTR reference number below to confirm your order.
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                        UPI Transaction / UTR Reference ID
                      </label>
                      <input
                        type="text"
                        required={paymentMethod === 'UPI'}
                        value={upiTransactionId}
                        onChange={(e) => setUpiTransactionId(e.target.value)}
                        placeholder="e.g., 432819045612"
                        className="w-full px-3 py-2 text-sm font-mono bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-md border border-[#E5DCCB] bg-[#F2ECE1]/60 text-xs text-[#5C544D] space-y-1">
                  <p className="font-semibold text-[#1E1B18]">
                    Cash on Delivery Terms — Total Payable: {formatINR(totalAmount)}
                  </p>
                  <p>
                    Complimentary insured courier across India. Please keep exact cash or UPI ready
                    at doorstep delivery.
                  </p>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#5C544D] border border-[#E5DCCB] rounded-md hover:border-[#6B1D2F] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 text-sm font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md cursor-pointer disabled:opacity-60"
              >
                {submitting ? 'Confirming Order...' : `Confirm Order · ${formatINR(totalAmount)}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
