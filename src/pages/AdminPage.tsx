import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Check,
  MessageCircle,
  Package,
  Plus,
  ShoppingCart,
  Trash2,
  Upload,
  Users,
} from 'lucide-react';
import { BoutiqueImage } from '../components/BoutiqueImage';
import {
  createProduct,
  deleteProduct,
  fetchAllOrdersAdmin,
  fetchAllProfilesAdmin,
  toggleProductStock,
  updateOrderStatusAdmin,
  uploadProductImage,
} from '../lib/api';
import { buildWhatsAppUrl, formatDate, formatINR } from '../lib/format';
import type {
  Order,
  OrderStatus,
  Product,
  ProductCategory,
  Profile,
} from '../types/boutique';

interface AdminPageProps {
  isAdmin: boolean;
  products: Product[];
  onProductsChanged: () => Promise<void>;
  onUnauthorized: () => void;
}

type AdminTab = 'collections' | 'orders' | 'customers';

const CATEGORIES: ProductCategory[] = [
  'Bridal Silks',
  'Designer Kurtis',
  'Aari Blouses',
  'Lehengas',
];

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];

const ORDER_STATUSES: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];

export function AdminPage({
  isAdmin,
  products,
  onProductsChanged,
  onUnauthorized,
}: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('collections');

  // Tab 1: Add Product Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Bridal Silks');
  const [price, setPrice] = useState('');
  const [sizes, setSizes] = useState<string[]>(['Free Size']);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Tab 2 & 3: Orders & Customers
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loadingAdminData, setLoadingAdminData] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      onUnauthorized();
    }
  }, [isAdmin, onUnauthorized]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    setLoadingAdminData(true);
    setAdminError(null);

    Promise.all([fetchAllOrdersAdmin(), fetchAllProfilesAdmin()])
      .then(([ordersData, profilesData]) => {
        if (!cancelled) {
          setOrders(ordersData);
          setProfiles(profilesData);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setAdminError(err instanceof Error ? err.message : 'Unable to fetch admin records');
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAdminData(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (!isAdmin) return null;

  const toggleSize = (size: string) => {
    setSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    setFormMessage(null);
    try {
      const publicUrl = await uploadProductImage(file);
      setImageUrl(publicUrl);
      setFormMessage({ type: 'success', text: 'Image uploaded to product-images storage.' });
    } catch (err) {
      setFormMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Image upload failed',
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    setFormMessage(null);

    const numericPrice = Number(price);
    if (!name.trim() || !description.trim() || !numericPrice || numericPrice <= 0 || !imageUrl) {
      setFormMessage({
        type: 'error',
        text: 'Please fill title, description, valid ₹ price, and upload a product image.',
      });
      return;
    }

    setCreatingProduct(true);
    try {
      await createProduct({
        name: name.trim(),
        category,
        price: numericPrice,
        sizes: sizes.length > 0 ? sizes : ['Free Size'],
        description: description.trim(),
        image_url: imageUrl,
        in_stock: true,
      });

      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setSizes(['Free Size']);
      setFormMessage({ type: 'success', text: 'New boutique garment added to catalog.' });
      await onProductsChanged();
    } catch (err) {
      setFormMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save product',
      });
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      await toggleProductStock(product.id, !product.in_stock);
      await onProductsChanged();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to update stock');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setConfirmDeleteId(null);
      await onProductsChanged();
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to delete item');
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const updated = await updateOrderStatusAdmin(orderId, newStatus);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'Unable to update order status');
    }
  };

  return (
    <main className="max-w-[1440px] mx-auto px-4 sm:px-8 py-10 lg:py-12 min-h-[75vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E5DCCB]">
        <div>
          <p className="text-xs font-medium text-[#6B1D2F]">Boutique Management Suite</p>
          <h1 className="font-serif text-3xl font-semibold text-[#1E1B18] mt-1">
            Kaveri Silks Atelier Admin
          </h1>
        </div>

        {/* 3-Tab Segmented Navigation */}
        <div
          className="inline-flex items-center gap-1 p-1 bg-[#F2ECE1] border border-[#E5DCCB] rounded-md overflow-x-auto"
          role="tablist"
          aria-label="Admin Management Sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'collections'}
            onClick={() => setActiveTab('collections')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'collections'
                ? 'bg-[#6B1D2F] text-[#FAF7F2]'
                : 'text-[#5C544D] hover:text-[#1E1B18]'
            }`}
          >
            <Package className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Manage Collections ({products.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            onClick={() => setActiveTab('orders')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#6B1D2F] text-[#FAF7F2]'
                : 'text-[#5C544D] hover:text-[#1E1B18]'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'customers'}
            onClick={() => setActiveTab('customers')}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-[#6B1D2F] text-[#FAF7F2]'
                : 'text-[#5C544D] hover:text-[#1E1B18]'
            }`}
          >
            <Users className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Registered Customers ({profiles.length})</span>
          </button>
        </div>
      </div>

      {adminError && (
        <div className="mt-6 p-3.5 text-xs font-medium text-[#6B1D2F] bg-[#6B1D2F]/10 border border-[#6B1D2F]/30 rounded-md">
          {adminError}
        </div>
      )}

      {/* TAB 1: MANAGE COLLECTIONS */}
      {activeTab === 'collections' && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add New Boutique Item Form */}
          <section className="lg:col-span-5 border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] p-6 space-y-5">
            <div className="flex items-center gap-2 border-b border-[#E5DCCB] pb-3">
              <Plus className="w-4 h-4 text-[#6B1D2F]" aria-hidden="true" />
              <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">
                Add Boutique Garment
              </h2>
            </div>

            {formMessage && (
              <div
                className={`p-3 text-xs font-medium rounded-md border ${
                  formMessage.type === 'success'
                    ? 'text-[#215A36] bg-[#215A36]/10 border-[#215A36]/30'
                    : 'text-[#6B1D2F] bg-[#6B1D2F]/10 border-[#6B1D2F]/30'
                }`}
              >
                {formMessage.text}
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                  Garment Title
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Arani Temple Gold Kanchipuram Silk"
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ProductCategory)}
                    className="w-full px-3 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                    Price (₹ INR)
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="28500"
                    className="w-full px-3.5 py-2 text-sm tabular-nums bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                  Available Sizes
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {SIZE_OPTIONS.map((size) => {
                    const selected = sizes.includes(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => toggleSize(size)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-sm border transition-colors cursor-pointer ${
                          selected
                            ? 'bg-[#6B1D2F] text-[#FAF7F2] border-[#6B1D2F]'
                            : 'bg-[#FAF7F2] text-[#5C544D] border-[#E5DCCB] hover:border-[#6B1D2F]'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1">
                  Description &amp; Weave Details
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe zari purity, motif craftsmanship, and fabric weight..."
                  className="w-full px-3.5 py-2 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                  Product Image Upload (`product-images`)
                </label>
                <label className="flex flex-col items-center justify-center p-4 border border-dashed border-[#C59B27] rounded-md bg-[#F2ECE1]/40 hover:bg-[#F2ECE1]/70 transition-colors cursor-pointer">
                  <Upload className="w-5 h-5 text-[#6B1D2F] mb-1.5" aria-hidden="true" />
                  <span className="text-xs font-medium text-[#1E1B18]">
                    {uploadingImage
                      ? 'Uploading image...'
                      : imageUrl
                      ? 'Replace uploaded photo'
                      : 'Choose product photograph (JPG, PNG, WEBP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>

                {imageUrl && (
                  <div className="mt-3 flex items-center gap-3 p-2 border border-[#E5DCCB] rounded-md bg-[#F2ECE1]/40">
                    <div className="w-16 h-12 rounded overflow-hidden shrink-0">
                      <BoutiqueImage
                        src={imageUrl}
                        alt="Uploaded preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#215A36] flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Photo ready</span>
                      </p>
                      <p className="text-[11px] text-[#5C544D] truncate">{imageUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={creatingProduct || uploadingImage}
                className="w-full py-3 px-4 text-sm font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] transition-colors rounded-md cursor-pointer disabled:opacity-60"
              >
                {creatingProduct ? 'Publishing Item...' : 'Publish to Boutique Catalog'}
              </button>
            </form>
          </section>

          {/* Live Catalog Management Table */}
          <section className="lg:col-span-7 border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#E5DCCB] flex items-center justify-between bg-[#F2ECE1]/50">
              <h2 className="font-serif text-xl font-semibold text-[#1E1B18]">
                Active Catalog Inventory
              </h2>
              <span className="text-xs font-medium tabular-nums text-[#5C544D]">
                {products.length} items
              </span>
            </div>

            <div className="divide-y divide-[#E5DCCB]">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-16 h-12 rounded overflow-hidden border border-[#E5DCCB] bg-[#F2ECE1] shrink-0">
                      <BoutiqueImage
                        src={product.image_url}
                        alt={product.name}
                        fallbackTitle={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-sm font-semibold text-[#1E1B18] truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-[#5C544D]">
                        {product.category} ·{' '}
                        <span className="font-semibold text-[#1E1B18] tabular-nums">
                          {formatINR(product.price)}
                        </span>{' '}
                        · {product.sizes.join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {/* Toggle Stock Switch */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={product.in_stock}
                      onClick={() => handleToggleStock(product)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors cursor-pointer ${
                        product.in_stock
                          ? 'border-[#215A36]/40 bg-[#215A36]/10 text-[#215A36]'
                          : 'border-[#E5DCCB] bg-[#F2ECE1] text-[#5C544D]'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          product.in_stock ? 'bg-[#215A36]' : 'bg-[#5C544D]'
                        }`}
                      />
                      <span>{product.in_stock ? 'In Stock' : 'Out of Stock'}</span>
                    </button>

                    {/* Delete Item with Inline Confirmation */}
                    {confirmDeleteId === product.id ? (
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1.5 text-xs font-medium text-[#5C544D] border border-[#E5DCCB] rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(product.id)}
                        aria-label={`Delete ${product.name}`}
                        className="p-2 text-[#5C544D] hover:text-[#6B1D2F] border border-transparent hover:border-[#E5DCCB] rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: CUSTOMER ORDERS & ADDRESS RECORDS */}
      {activeTab === 'orders' && (
        <div className="mt-8 space-y-4">
          {loadingAdminData ? (
            <div className="h-48 rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/40 animate-pulse" />
          ) : orders.length === 0 ? (
            <div className="p-12 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/30">
              <p className="font-serif text-lg text-[#1E1B18]">No customer orders received yet</p>
              <p className="text-xs text-[#5C544D] mt-1">
                New storefront orders will appear here sorted by newest first.
              </p>
            </div>
          ) : (
            <div className="border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[960px]">
                <thead>
                  <tr className="border-b border-[#E5DCCB] bg-[#F2ECE1]/70 text-[11px] font-semibold uppercase tracking-wider text-[#5C544D]">
                    <th className="py-3.5 px-4">Order &amp; Date</th>
                    <th className="py-3.5 px-4">Customer &amp; WhatsApp</th>
                    <th className="py-3.5 px-4">Full Delivery Address</th>
                    <th className="py-3.5 px-4">Ordered Items</th>
                    <th className="py-3.5 px-4">Total &amp; Payment</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DCCB] text-xs">
                  {orders.map((order) => {
                    const waLink = buildWhatsAppUrl(
                      order.customer_phone,
                      `Namaskaram ${order.customer_name}, greeting from Kaveri Silks regarding your Order #${order.id} (${formatINR(order.total_amount)}).`
                    );
                    return (
                      <tr key={order.id} className="align-top hover:bg-[#F2ECE1]/30">
                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="font-mono font-semibold text-[#1E1B18]">{order.id}</p>
                          <p className="text-[#5C544D] tabular-nums mt-0.5">
                            {formatDate(order.created_at)}
                          </p>
                        </td>

                        <td className="py-4 px-4">
                          <p className="font-semibold text-[#1E1B18]">{order.customer_name}</p>
                          <p className="text-[#5C544D] tabular-nums mt-0.5">
                            {order.customer_phone}
                          </p>
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-semibold text-[#6B1D2F] hover:underline"
                          >
                            <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>Message on WhatsApp</span>
                          </a>
                        </td>

                        <td className="py-4 px-4 max-w-[260px]">
                          <p className="text-[#1E1B18] leading-relaxed">
                            {order.shipping_address}
                          </p>
                          <p className="text-[#5C544D] font-medium mt-0.5">
                            {order.city} — <span className="tabular-nums">{order.pincode}</span>
                          </p>
                        </td>

                        <td className="py-4 px-4 max-w-[250px]">
                          <ul className="space-y-1">
                            {order.items.map((item, idx) => (
                              <li key={idx} className="text-[#1E1B18]">
                                <span className="font-medium">{item.name}</span>{' '}
                                <span className="text-[#5C544D]">
                                  ({item.size} × {item.quantity})
                                </span>
                              </li>
                            ))}
                          </ul>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <p className="font-bold text-sm tabular-nums text-[#1E1B18]">
                            {formatINR(order.total_amount)}
                          </p>
                          <p className="text-[#5C544D] mt-0.5">{order.payment_method}</p>
                          {order.upi_transaction_id && (
                            <p className="font-mono text-[11px] text-[#6B1D2F] mt-0.5">
                              UTR: {order.upi_transaction_id}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          <select
                            aria-label={`Update status for order ${order.id}`}
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value as OrderStatus)
                            }
                            className="px-2.5 py-1.5 text-xs font-semibold bg-[#FAF7F2] border border-[#E5DCCB] rounded-md text-[#1E1B18] focus:outline-none focus:border-[#6B1D2F] cursor-pointer"
                          >
                            {ORDER_STATUSES.map((st) => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: REGISTERED CUSTOMERS DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="mt-8">
          {loadingAdminData ? (
            <div className="h-48 rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/40 animate-pulse" />
          ) : profiles.length === 0 ? (
            <div className="p-12 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/30">
              <p className="font-serif text-lg text-[#1E1B18]">No registered patrons yet</p>
              <p className="text-xs text-[#5C544D] mt-1">
                Signed-up customer profiles will be listed here automatically.
              </p>
            </div>
          ) : (
            <div className="border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[720px]">
                <thead>
                  <tr className="border-b border-[#E5DCCB] bg-[#F2ECE1]/70 text-[11px] font-semibold uppercase tracking-wider text-[#5C544D]">
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Email</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">City</th>
                    <th className="py-3.5 px-4">Pincode</th>
                    <th className="py-3.5 px-4">Join Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5DCCB] text-xs">
                  {profiles.map((p) => (
                    <tr key={p.id} className="hover:bg-[#F2ECE1]/30">
                      <td className="py-3.5 px-4 font-semibold text-[#1E1B18]">{p.full_name}</td>
                      <td className="py-3.5 px-4 text-[#5C544D]">{p.email}</td>
                      <td className="py-3.5 px-4 tabular-nums text-[#1E1B18]">{p.phone}</td>
                      <td className="py-3.5 px-4 text-[#5C544D]">{p.city || '—'}</td>
                      <td className="py-3.5 px-4 tabular-nums text-[#5C544D]">
                        {p.pincode || '—'}
                      </td>
                      <td className="py-3.5 px-4 tabular-nums text-[#5C544D]">
                        {formatDate(p.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
