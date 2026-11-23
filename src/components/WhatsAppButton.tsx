import { MessageCircle } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/format';
import { BOUTIQUE_WHATSAPP } from '../lib/supabase';

export function WhatsAppButton() {
  const href = buildWhatsAppUrl(
    BOUTIQUE_WHATSAPP,
    'Namaskaram Kaveri Silks! I would like styling assistance for a bridal or festive order.'
  );

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Kaveri Silks concierge on WhatsApp"
      className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[#6B1D2F] text-[#FAF7F2] border border-[#C59B27]/70 shadow-lg hover:bg-[#521422] transition-transform duration-150 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-[#C59B27]"
    >
      <MessageCircle className="w-4 h-4 text-[#DFC06B]" aria-hidden="true" />
      <span className="text-xs font-semibold whitespace-nowrap">WhatsApp Stylist</span>
    </a>
  );
}
