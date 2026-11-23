import type {
  AuthUser,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  Product,
  ProductCategory,
  Profile,
  Review,
} from '../types/boutique';
import { isSupabaseConfigured, supabase } from './supabase';

const TOKEN_KEY = 'kaveri_session_token';

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore storage errors
  }
}

async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Request failed');
  }
  return data as T;
}

export async function getSession(): Promise<{ user: AuthUser; profile: Profile | null } | null> {
  if (isSupabaseConfigured && supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !user.email) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    return {
      user: { id: user.id, email: user.email },
      profile: (profile as Profile | null) || null,
    };
  }

  const token = getToken();
  if (!token) return null;
  try {
    return await apiFetch<{ user: AuthUser; profile: Profile | null }>('/api/auth/session');
  } catch {
    setToken(null);
    return null;
  }
}

export async function signUpCustomer(payload: {
  full_name: string;
  email: string;
  phone: string;
  password: string;
}): Promise<{ user: AuthUser; profile: Profile | null }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim(),
      password: payload.password,
      options: {
        data: {
          full_name: payload.full_name.trim(),
          phone: payload.phone.trim(),
        },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.user || !data.user.email) {
      throw new Error('Account created. Please verify your email if confirmation is enabled.');
    }

    const profileRow = {
      id: data.user.id,
      full_name: payload.full_name.trim(),
      email: data.user.email,
      phone: payload.phone.trim(),
      saved_address: '',
      city: '',
      pincode: '',
    };

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert(profileRow)
      .select()
      .single();

    if (profileError) throw new Error(profileError.message);

    return {
      user: { id: data.user.id, email: data.user.email },
      profile: profile as Profile,
    };
  }

  const result = await apiFetch<{ token: string; user: AuthUser; profile: Profile | null }>(
    '/api/auth/signup',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setToken(result.token);
  return { user: result.user, profile: result.profile };
}

export async function signInCustomer(payload: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; profile: Profile | null }> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email.trim(),
      password: payload.password,
    });
    if (error) throw new Error(error.message);
    if (!data.user || !data.user.email) throw new Error('Unable to sign in');

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    return {
      user: { id: data.user.id, email: data.user.email },
      profile: (profile as Profile | null) || null,
    };
  }

  const result = await apiFetch<{ token: string; user: AuthUser; profile: Profile | null }>(
    '/api/auth/signin',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  setToken(result.token);
  return { user: result.user, profile: result.profile };
}

export async function signOutCustomer(): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    await supabase.auth.signOut();
    return;
  }
  try {
    await apiFetch('/api/auth/signout', { method: 'POST' });
  } finally {
    setToken(null);
  }
}

export async function fetchProducts(): Promise<Product[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Product[];
  }
  return apiFetch<Product[]>('/api/products');
}

export async function uploadProductImage(file: File): Promise<string> {
  if (isSupabaseConfigured && supabase) {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, { cacheControl: '3600', upsert: false });
    if (errorOrThrow(uploadError)) throw new Error(uploadError!.message);

    const { data } = supabase.storage.from('product-images').getPublicUrl(filePath);
    return data.publicUrl;
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });

  const res = await apiFetch<{ publicUrl: string }>('/api/upload', {
    method: 'POST',
    body: JSON.stringify({ filename: file.name, dataUrl }),
  });
  return res.publicUrl;
}

function errorOrThrow(err: { message: string } | null): boolean {
  return Boolean(err);
}

export async function createProduct(payload: {
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  sizes: string[];
  image_url: string;
  in_stock?: boolean;
}): Promise<Product> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .insert({ ...payload, in_stock: payload.in_stock ?? true })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  }
  return apiFetch<Product>('/api/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function toggleProductStock(id: string, inStock: boolean): Promise<Product> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('products')
      .update({ in_stock: inStock })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Product;
  }
  return apiFetch<Product>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ in_stock: inStock }),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return;
  }
  await apiFetch(`/api/products/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function createOrder(payload: {
  user_id: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  total_amount: number;
  payment_method: PaymentMethod;
  upi_transaction_id: string | null;
}): Promise<Order> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .insert({
        ...payload,
        status: 'Pending',
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    // Update customer saved address for future checkouts
    await supabase
      .from('profiles')
      .update({
        full_name: payload.customer_name,
        phone: payload.customer_phone,
        saved_address: payload.shipping_address,
        city: payload.city,
        pincode: payload.pincode,
      })
      .eq('id', payload.user_id);

    return data as Order;
  }

  return apiFetch<Order>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyOrders(userId: string): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Order[];
  }
  return apiFetch<Order[]>('/api/orders');
}

export async function fetchAllOrdersAdmin(): Promise<Order[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Order[];
  }
  return apiFetch<Order[]>('/api/orders?scope=admin');
}

export async function updateOrderStatusAdmin(id: string, status: OrderStatus): Promise<Order> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Order;
  }
  return apiFetch<Order>(`/api/orders/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function fetchAllProfilesAdmin(): Promise<Profile[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Profile[];
  }
  return apiFetch<Profile[]>('/api/profiles');
}

export async function fetchProductReviews(productId: string): Promise<Review[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []) as Review[];
  }
  return apiFetch<Review[]>(`/api/products/${encodeURIComponent(productId)}/reviews`);
}

export async function checkCanReviewProduct(
  productId: string,
  userId: string
): Promise<{ canReview: boolean; hasReviewed: boolean; hasOrdered: boolean }> {
  if (isSupabaseConfigured && supabase) {
    const [{ data: orders }, { data: existingReview }] = await Promise.all([
      supabase.from('orders').select('items').eq('user_id', userId),
      supabase
        .from('reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .maybeSingle(),
    ]);

    const hasOrdered = Boolean(
      orders?.some((o) =>
        Array.isArray(o.items) &&
        o.items.some((item: { product_id?: string }) => item.product_id === productId)
      )
    );
    const hasReviewed = Boolean(existingReview);
    return { canReview: hasOrdered && !hasReviewed, hasReviewed, hasOrdered };
  }

  return apiFetch<{ canReview: boolean; hasReviewed: boolean; hasOrdered: boolean }>(
    `/api/products/${encodeURIComponent(productId)}/can-review`
  );
}

export async function createProductReview(payload: {
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
}): Promise<Review> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(payload)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Review;
  }

  return apiFetch<Review>(`/api/products/${encodeURIComponent(payload.product_id)}/reviews`, {
    method: 'POST',
    body: JSON.stringify({ rating: payload.rating, comment: payload.comment }),
  });
}

export async function fetchWatchlist(userId: string): Promise<string[]> {
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('watchlist')
      .select('product_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map((row: { product_id: string }) => row.product_id);
  }
  return apiFetch<string[]>('/api/watchlist');
}

export async function addToWatchlistApi(userId: string, productId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('watchlist')
      .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });
    if (error) throw new Error(error.message);
    return;
  }
  await apiFetch('/api/watchlist', {
    method: 'POST',
    body: JSON.stringify({ product_id: productId }),
  });
}

export async function removeFromWatchlistApi(userId: string, productId: string): Promise<void> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase
      .from('watchlist')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId);
    if (error) throw new Error(error.message);
    return;
  }
  await apiFetch(`/api/watchlist/${encodeURIComponent(productId)}`, { method: 'DELETE' });
}

