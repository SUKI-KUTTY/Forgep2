import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  Heart,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Star,
} from 'lucide-react';
import { BoutiqueImage } from '../components/BoutiqueImage';
import {
  checkCanReviewProduct,
  createProductReview,
  fetchProductReviews,
} from '../lib/api';
import { formatDate, formatINR } from '../lib/format';
import {
  CATEGORY_META,
  type AuthUser,
  type Product,
  type Profile,
  type Review,
} from '../types/boutique';

interface ProductDetailPageProps {
  product: Product | undefined;
  loadingProducts: boolean;
  user: AuthUser | null;
  profile: Profile | null;
  isWatchlisted: boolean;
  onToggleWatchlist: (productId: string) => void;
  onAddToBag: (product: Product, size: string) => void;
  onBuyNow: (product: Product, size: string) => void;
  onOpenAuth: () => void;
  onBackToStore: () => void;
}

function StarRow({
  rating,
  size = 'sm',
}: {
  rating: number;
  size?: 'sm' | 'md';
}) {
  const iconCls = size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  return (
    <div className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${iconCls} ${
            star <= Math.round(rating)
              ? 'fill-[#C59B27] text-[#C59B27]'
              : 'fill-transparent text-[#E5DCCB]'
          }`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

export function ProductDetailPage({
  product,
  loadingProducts,
  user,
  profile,
  isWatchlisted,
  onToggleWatchlist,
  onAddToBag,
  onBuyNow,
  onOpenAuth,
  onBackToStore,
}: ProductDetailPageProps) {
  const availableSizes = product?.sizes.length ? product.sizes : ['Free Size'];
  const [selectedSize, setSelectedSize] = useState<string>(availableSizes[0]);
  const [justAdded, setJustAdded] = useState(false);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [eligibility, setEligibility] = useState<{
    canReview: boolean;
    hasReviewed: boolean;
    hasOrdered: boolean;
  }>({ canReview: false, hasReviewed: false, hasOrdered: false });
  const [ratingInput, setRatingInput] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setSelectedSize(product.sizes.length ? product.sizes[0] : 'Free Size');
    }
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    setLoadingReviews(true);
    fetchProductReviews(product.id)
      .then((data) => {
        if (!cancelled) setReviews(data);
      })
      .finally(() => {
        if (!cancelled) setLoadingReviews(false);
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id]);

  useEffect(() => {
    if (!product || !user) {
      setEligibility({ canReview: false, hasReviewed: false, hasOrdered: false });
      return;
    }
    let cancelled = false;
    checkCanReviewProduct(product.id, user.id)
      .then((res) => {
        if (!cancelled) setEligibility(res);
      })
      .catch(() => {
        if (!cancelled) {
          setEligibility({ canReview: false, hasReviewed: false, hasOrdered: false });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [product?.id, user?.id]);

  if (loadingProducts) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-12 min-h-[70vh]">
        <div className="h-[460px] rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/50 animate-pulse" />
      </main>
    );
  }

  if (!product) {
    return (
      <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-16 text-center space-y-4 min-h-[65vh]">
        <h1 className="font-serif text-2xl font-semibold text-[#1E1B18]">
          Garment Not Found
        </h1>
        <p className="text-sm text-[#5C544D]">
          This piece may have been archived from our seasonal catalog.
        </p>
        <button
          type="button"
          onClick={onBackToStore}
          className="px-5 py-2.5 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
        >
          Return to Collections
        </button>
      </main>
    );
  }

  const catMeta = CATEGORY_META[product.category];
  const averageRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  const handleAdd = () => {
    if (!product.in_stock) return;
    onAddToBag(product, selectedSize);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const handleReviewSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setReviewError(null);
    setReviewSuccess(null);
    setSubmittingReview(true);

    try {
      const created = await createProductReview({
        product_id: product.id,
        user_id: user.id,
        reviewer_name: profile?.full_name || user.email.split('@')[0],
        rating: ratingInput,
        comment: commentInput.trim(),
      });
      setReviews((prev) => [created, ...prev]);
      setCommentInput('');
      setEligibility({ canReview: false, hasReviewed: true, hasOrdered: true });
      setReviewSuccess('Thank you — your verified review has been published.');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Unable to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 lg:py-14 space-y-16">
      {/* Breadcrumb Back Action */}
      <div>
        <button
          type="button"
          onClick={onBackToStore}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B1D2F] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Collections</span>
        </button>
      </div>

      {/* Contiguous Purchase Module (PDP) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Sticky Gallery */}
        <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-3">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]">
            <BoutiqueImage
              src={product.image_url}
              alt={product.name}
              fallbackTitle={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#5C544D] px-1">
            <span>Silk Mark Certified · Handloom Craftsmanship</span>
            <span>Insured Pan-India Dispatch</span>
          </div>
        </div>

        {/* Right Purchase Module */}
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6 border border-[#E5DCCB] rounded-lg bg-[#FAF7F2] p-6 sm:p-8">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs">
              <span className="font-medium text-[#6B1D2F]">
                {catMeta?.en || product.category} · {catMeta?.ta}
              </span>
              <span className="font-medium text-[#5C544D]">
                {product.in_stock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#1E1B18] leading-snug text-balance">
              {product.name}
            </h1>

            {/* Average Rating Summary */}
            <div className="flex items-center gap-2.5 pt-1 text-xs text-[#5C544D]">
              <StarRow rating={averageRating} size="sm" />
              {reviews.length > 0 ? (
                <span className="tabular-nums font-medium text-[#1E1B18]">
                  {averageRating.toFixed(1)} · {reviews.length}{' '}
                  {reviews.length === 1 ? 'Verified Review' : 'Verified Reviews'}
                </span>
              ) : (
                <span>No reviews yet · Verified buyer reviews</span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5DCCB]">
            <p className="text-2xl font-bold text-[#1E1B18] tabular-nums">
              {formatINR(product.price)}
            </p>
            <p className="text-[11px] text-[#5C544D] mt-0.5">
              Inclusive of all taxes · Complimentary Silk Storage Muslin Bag
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[#5C544D]">{product.description}</p>

          {/* Size Selector */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1E1B18]">Select Size</span>
              <span className="text-[#5C544D]">{selectedSize}</span>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select size">
              {availableSizes.map((size) => {
                const active = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    disabled={!product.in_stock}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
                      active
                        ? 'bg-[#6B1D2F] text-[#FAF7F2] border-[#6B1D2F]'
                        : 'bg-[#FAF7F2] text-[#1E1B18] border-[#E5DCCB] hover:border-[#6B1D2F]'
                    }`}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Purchase Actions + Watchlist */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!product.in_stock}
                onClick={handleAdd}
                className="inline-flex items-center justify-center gap-2 px-4 py-3 text-xs font-semibold border border-[#6B1D2F] text-[#6B1D2F] hover:bg-[#6B1D2F] hover:text-[#FAF7F2] transition-colors rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4" aria-hidden="true" />
                    <span>Added to Bag</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                    <span>Add to Bag</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={!product.in_stock}
                onClick={() => onBuyNow(product, selectedSize)}
                className="inline-flex items-center justify-center px-4 py-3 text-xs font-semibold bg-[#6B1D2F] text-[#FAF7F2] hover:bg-[#521422] transition-colors rounded-md cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Buy Now
              </button>
            </div>

            <button
              type="button"
              onClick={() => onToggleWatchlist(product.id)}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold border rounded-md transition-colors cursor-pointer ${
                isWatchlisted
                  ? 'border-[#6B1D2F] bg-[#6B1D2F]/8 text-[#6B1D2F]'
                  : 'border-[#E5DCCB] text-[#1E1B18] hover:border-[#6B1D2F]'
              }`}
            >
              <Heart
                className={`w-4 h-4 ${
                  isWatchlisted ? 'fill-[#6B1D2F] text-[#6B1D2F]' : 'text-[#6B1D2F]'
                }`}
                aria-hidden="true"
              />
              <span>{isWatchlisted ? 'Saved in Watchlist' : 'Add to Watchlist'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section
        id="reviews"
        className="pt-10 border-t border-[#E5DCCB] grid grid-cols-1 lg:grid-cols-12 gap-10"
      >
        {/* Left: Rating Summary & Review Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#6B1D2F]">Patron Feedback</p>
            <h2 className="font-serif text-2xl font-semibold text-[#1E1B18]">
              Customer Reviews
            </h2>
          </div>

          {/* Aggregate Rating Box */}
          <div className="p-5 rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/60 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-3xl font-bold text-[#1E1B18] tabular-nums">
                  {reviews.length > 0 ? averageRating.toFixed(1) : '—'}
                </p>
                <p className="text-xs text-[#5C544D] mt-0.5 tabular-nums">
                  Based on {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                </p>
              </div>
              <StarRow rating={averageRating} size="md" />
            </div>

            {/* 5-to-1 Breakdown */}
            <div className="space-y-1.5 pt-2 border-t border-[#E5DCCB]">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = reviews.filter((r) => r.rating === star).length;
                const pct = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 text-xs">
                    <span className="w-8 tabular-nums text-[#5C544D] font-medium">{star} ★</span>
                    <div className="flex-1 h-2 bg-[#E5DCCB]/70 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#C59B27] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-8 text-right tabular-nums text-[#5C544D]">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leave a Review Panel */}
          <div className="p-5 rounded-lg border border-[#E5DCCB] bg-[#FAF7F2] space-y-4">
            <h3 className="font-serif text-lg font-semibold text-[#1E1B18]">
              Share Your Experience
            </h3>

            {!user ? (
              <div className="space-y-3">
                <p className="text-xs leading-relaxed text-[#5C544D]">
                  Sign in with your patron account to leave a star rating and comment on garments
                  you have ordered.
                </p>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5 text-[#DFC06B]" aria-hidden="true" />
                  <span>Sign In to Review</span>
                </button>
              </div>
            ) : eligibility.hasReviewed ? (
              <div className="flex items-start gap-2.5 text-xs text-[#215A36]">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {reviewSuccess || 'You have already published a verified review for this garment.'}
                </span>
              </div>
            ) : !eligibility.hasOrdered ? (
              <div className="flex items-start gap-2.5 text-xs text-[#5C544D]">
                <ShieldCheck className="w-4 h-4 text-[#C59B27] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Verified Purchase Required — Only customers who have ordered this garment can
                  submit a star rating and comment.
                </span>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewError && (
                  <div className="p-2.5 text-xs text-[#6B1D2F] bg-[#6B1D2F]/10 border border-[#6B1D2F]/30 rounded-md">
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                    Your Rating
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating ?? ratingInput) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(null)}
                          onClick={() => setRatingInput(star)}
                          aria-label={`Rate ${star} out of 5 stars`}
                          className="p-1 cursor-pointer"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              active
                                ? 'fill-[#C59B27] text-[#C59B27]'
                                : 'fill-transparent text-[#E5DCCB]'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 text-xs font-medium text-[#5C544D] tabular-nums">
                      {ratingInput} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#1E1B18] mb-1.5">
                    Your Review Comment
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={5}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Share your thoughts on silk lustre, zari craftsmanship, and fit..."
                    className="w-full px-3.5 py-2.5 text-sm bg-[#FAF7F2] border border-[#E5DCCB] rounded-md focus:outline-none focus:border-[#6B1D2F]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-[#FAF7F2] bg-[#6B1D2F] hover:bg-[#521422] rounded-md transition-colors cursor-pointer disabled:opacity-60"
                >
                  {submittingReview ? 'Publishing Review...' : 'Submit Verified Review'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Right: Published Reviews List */}
        <div className="lg:col-span-7">
          {loadingReviews ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-28 rounded-lg border border-[#E5DCCB] bg-[#F2ECE1]/40 animate-pulse"
                />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-10 text-center border border-[#E5DCCB] rounded-lg bg-[#F2ECE1]/30 space-y-2">
              <p className="font-serif text-lg text-[#1E1B18]">No customer reviews yet</p>
              <p className="text-xs text-[#5C544D]">
                Patrons who purchase this weave can share their verified rating and impressions here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5DCCB] border-t border-b border-[#E5DCCB]">
              {reviews.map((review) => (
                <article key={review.id} className="py-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-serif text-sm font-semibold text-[#1E1B18]">
                        {review.reviewer_name}
                      </span>
                      <span aria-hidden="true" className="text-[#C59B27]">·</span>
                      <span className="text-[#215A36] font-medium">Verified Buyer</span>
                    </div>
                    <span className="text-xs text-[#5C544D] tabular-nums">
                      {formatDate(review.created_at)}
                    </span>
                  </div>

                  <StarRow rating={review.rating} size="sm" />

                  <p className="text-sm leading-relaxed text-[#1E1B18]">{review.comment}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
