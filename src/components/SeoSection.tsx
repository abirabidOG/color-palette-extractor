import React from 'react';
import { Palette, Layers, Home, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export default function SeoSection() {
  return (
    <section className="mt-20 border-t border-[#E5E1D6] bg-[#F4F2EC] py-16 sm:py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Main H1 & Introduction */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-[#E5E1D6] text-xs font-mono font-medium text-[#1F8C7F] mb-4 shadow-2xs">
            <Sparkles className="h-3.5 w-3.5 text-[#1F8C7F]" />
            100% In-Browser Color Quantization
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#0B0B0D]">
            Free Color Palette Extractor From Any Photo or Logo
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[#4F4E55] leading-relaxed">
            Extract authentic, harmonic color swatches and exact HEX codes from any photograph, graphic, or brand logo in seconds. Your images are parsed 100% locally on your device with HTML5 Canvas.
          </p>
        </div>

        {/* Section 1: H2 - Get a color palette that actually matches your photo */}
        <div className="mb-16 rounded-3xl border border-[#E5E1D6] bg-white p-8 sm:p-12 shadow-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0D] mb-4">
            Get a color palette that actually matches your photo
          </h2>
          <p className="text-sm sm:text-base text-[#4F4E55] leading-relaxed mb-6">
            Unlike generative AI tools that hallucinate random trendy color schemes, Color Palette Extractor runs a deterministic color quantization algorithm right inside your browser. It scans real image pixels, eliminates transparent alpha voids, clusters dominant color boxes, and extracts distinct light and dark shades. Every HEX code you see is an authentic color sampled directly from your visual asset.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E5E1D6]">
            <div>
              <p className="font-bold text-[#0B0B0D] text-sm mb-1">True Pixel Sampling</p>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Zero synthetic palettes. Colors reflect the true lighting and pigment of your uploaded image.
              </p>
            </div>
            <div>
              <p className="font-bold text-[#0B0B0D] text-sm mb-1">Interactive Eyedropper</p>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Click anywhere on the preview image to sample and add custom pixel swatches up to 8 total.
              </p>
            </div>
            <div>
              <p className="font-bold text-[#0B0B0D] text-sm mb-1">Flexible Export Formats</p>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Download a clean PNG swatch strip, a plain TXT list, or copy all HEX values with 1 click.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: H2 - What to do with your palette with 3 short points */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0B0B0D]">
              What to do with your palette
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#4F4E55]">
              Three simple ways to put your extracted color codes to work immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F8C7F]/10 text-[#1F8C7F] mb-4">
                <Palette className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0D] mb-2">
                Copy HEX codes into Canva or Figma
              </h3>
              <p className="text-sm text-[#4F4E55] leading-relaxed">
                Paste your extracted HEX codes straight into Canva, Figma, Adobe Illustrator, or Photoshop to maintain flawless color harmony across social graphics, presentations, and UI designs.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F8C7F]/10 text-[#1F8C7F] mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0D] mb-2">
                Use them for branding
              </h3>
              <p className="text-sm text-[#4F4E55] leading-relaxed">
                Build consistent brand guidelines, primary and secondary palette hierarchies, and web themes that accurately mirror your company logo and hero photography.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E5E1D6] bg-white p-6 shadow-2xs hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1F8C7F]/10 text-[#1F8C7F] mb-4">
                <Home className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-lg text-[#0B0B0D] mb-2">
                Use them for wedding or home decor
              </h3>
              <p className="text-sm text-[#4F4E55] leading-relaxed">
                Take inspiration from moodboards, nature photos, or floral arrangements. Extract balanced accent, neutral, and base colors for wedding stationery or interior paint projects.
              </p>
            </div>
          </div>
        </div>

        {/* Cross-Promotion Banners to WEBPTools, Logo File Kit, and Image Resizer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#E5E1D6] bg-white p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#1F8C7F] font-semibold mb-1">
                Fast &amp; Lossless Compression
              </p>
              <h4 className="font-bold text-[#0B0B0D] text-base mb-1">
                Need lighter images too? Try WEBPTools
              </h4>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Batch convert PNG, JPG and SVG to modern high-efficiency WebP in seconds.
              </p>
            </div>
            <a
              href="https://tools.abidmahmud.cv/webptools"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F8C7F] hover:text-[#176E64] transition-colors"
            >
              Open WEBPTools <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-2xl border border-[#E5E1D6] bg-white p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#1F8C7F] font-semibold mb-1">
                Logo Resizer &amp; Transparent Exporter
              </p>
              <h4 className="font-bold text-[#0B0B0D] text-base mb-1">
                Need the right logo files too? Try Logo File Kit
              </h4>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Export transparent PNGs, favicons, social icons, and 2000px print master files.
              </p>
            </div>
            <a
              href="https://tools.abidmahmud.cv/logo-kit"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F8C7F] hover:text-[#176E64] transition-colors"
            >
              Open Logo File Kit <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>

          <div className="rounded-2xl border border-[#E5E1D6] bg-white p-5 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#1F8C7F] font-semibold mb-1">
                Social, Etsy &amp; Blog Resizing
              </p>
              <h4 className="font-bold text-[#0B0B0D] text-base mb-1">
                Need the right image size too? Try Image Resizer
              </h4>
              <p className="text-xs text-[#4F4E55] leading-relaxed">
                Batch resize photos for Pinterest, Instagram, Etsy, and blog posts with custom fit modes.
              </p>
            </div>
            <a
              href="https://tools.abidmahmud.cv/image-resizer"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-[#1F8C7F] hover:text-[#176E64] transition-colors"
            >
              Open Image Resizer <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
