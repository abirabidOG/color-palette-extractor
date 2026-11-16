import ColorPaletteTool from '../components/ColorPaletteTool';
import SeoSection from '../components/SeoSection';
import FaqSection from '../components/FaqSection';
import { FAQS } from '../data/faqs';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const jsonLdFaq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  const jsonLdApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Color Palette Extractor — Get a Color Palette From Any Photo or Logo Free',
    url: 'https://tools.abidmahmud.cv/palette-extractor',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'All (Browser-based)',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description:
      'Get the perfect color palette from any photo or logo in seconds. Free, no upload, your image never leaves your browser. Color quantization, HEX & RGB export, and click-to-pick eyedropper.',
    browserRequirements:
      'Requires HTML5 Canvas capable browser (Chrome, Safari, Firefox, Edge).',
    author: {
      '@type': 'Person',
      name: 'Abid Mahmud',
      url: 'https://www.abidmahmud.cv',
      jobTitle: 'Brand Identity Designer',
    },
  };

  return (
    <div className="space-y-12">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdApp) }}
      />

      {/* Hero Header */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-8">
        <div className="text-center space-y-3 max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF7F5] border border-[#B6E2DC] text-xs font-mono font-medium text-[#1F8C7F]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% Client-Side • In-Browser Canvas API</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B0B0D]">
            Color Palette Extractor
          </h2>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4F4E55] leading-relaxed">
            Get the perfect color palette from any photo or logo in seconds. Free, no upload, your image never leaves your browser.
          </p>
        </div>

        {/* Main Interactive Tool */}
        <ColorPaletteTool />
      </div>

      {/* SEO Content: Platform Guides & Common Uses */}
      <SeoSection />

      {/* FAQ Accordion */}
      <FaqSection />
    </div>
  );
}
