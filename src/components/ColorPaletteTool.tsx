'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  UploadCloud,
  Check,
  Copy,
  Download,
  FileText,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Pipette,
  AlertCircle,
  X,
  Trash2,
  Code,
  Share2,
  Bookmark,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';
import {
  ColorSwatch,
  extractPaletteFromCanvas,
  rgbToHex,
  hexToRgb,
  getLuminance,
  getContrastTextColor,
  getWcagContrast,
  generateHarmonies,
  generateCssVariablesCode,
  generateTailwindConfigCode,
  generateJsonCode,
  createSwatchFromRgb,
  generatePalettePng,
  generatePaletteTxt,
} from '../lib/paletteExtractor';
import { createSamplePhotoCanvas, SAMPLE_PHOTO_NAME } from '../lib/samplePhoto';
import {
  trackPaletteExtracted,
  trackDownloadPalette,
  trackPaletteExported,
  trackContrastChecked,
  trackGradientCopied,
} from '../lib/analytics';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

interface MultiImageItem {
  id: string;
  name: string;
  img: HTMLImageElement;
  objectUrl: string;
  palette: ColorSwatch[];
}

interface SavedPaletteItem {
  id: string;
  name: string;
  hexes: string[];
  swatches: ColorSwatch[];
  date: string;
}

export default function ColorPaletteTool() {
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [colorCount, setColorCount] = useState<3 | 5 | 8 | 12>(5);
  const [imageTitle, setImageTitle] = useState<string>('');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  // Phase 2: Multi-image mode
  const [imageList, setImageList] = useState<MultiImageItem[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);

  // Phase 2: Gradient Builder
  const [gradientAngle, setGradientAngle] = useState<number>(135);
  const [gradientIndices, setGradientIndices] = useState<number[]>([0, 1]);

  // Phase 2: Contrast Checker View Toggle
  const [showContrast, setShowContrast] = useState<boolean>(true);

  // Phase 2: Saved Palettes & Share
  const [savedPalettes, setSavedPalettes] = useState<SavedPaletteItem[]>([]);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load saved palettes from localStorage on mount & handle URL hash
  useEffect(() => {
    try {
      const stored = localStorage.getItem('tools_saved_palettes');
      if (stored) {
        setSavedPalettes(JSON.parse(stored));
      }
    } catch (_) {}

    // Check URL Hash for shared palette (#palette=HEX,HEX,HEX)
    if (typeof window !== 'undefined' && window.location.hash) {
      const match = window.location.hash.match(/#palette=([a-fA-F0-9,]+)/i);
      if (match && match[1]) {
        const hexList = match[1].split(',').filter(Boolean);
        if (hexList.length >= 2) {
          const restoredSwatches = hexList.map((rawHex, idx) => {
            const cleanHex = rawHex.startsWith('#') ? rawHex : `#${rawHex}`;
            const [r, g, b] = hexToRgb(cleanHex);
            return createSwatchFromRgb(r, g, b, `hash-${idx}`);
          });
          setSwatches(restoredSwatches);
          setImageTitle('Shared URL Palette');
        }
      }
    }
  }, []);

  // Clear copied notification after 2 seconds
  useEffect(() => {
    if (!copiedId && !copiedAll && !feedbackToast) return;
    const timer = setTimeout(() => {
      setCopiedId(null);
      setCopiedAll(false);
      setFeedbackToast(null);
    }, 2500);
    return () => clearTimeout(timer);
  }, [copiedId, copiedAll, feedbackToast]);

  // Redraw preview canvas whenever imageElement changes
  useEffect(() => {
    if (!imageElement || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    canvas.width = imageElement.naturalWidth || imageElement.width;
    canvas.height = imageElement.naturalHeight || imageElement.height;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imageElement, 0, 0);
    }
  }, [imageElement]);

  const processImage = useCallback(
    (img: HTMLImageElement, name: string, count: 3 | 5 | 8 | 12, isSample: boolean = false) => {
      setIsProcessing(true);
      setErrorMessage(null);

      try {
        const offscreen = document.createElement('canvas');
        offscreen.width = img.naturalWidth || img.width || 800;
        offscreen.height = img.naturalHeight || img.height || 600;
        const ctx = offscreen.getContext('2d');
        if (!ctx) throw new Error('Could not initialize canvas context');

        ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);

        const extracted = extractPaletteFromCanvas(offscreen, count);
        if (extracted.length === 0) {
          throw new Error('Could not extract colors from this image. Please ensure it contains non-transparent pixels.');
        }

        setSwatches(extracted);
        setImageElement(img);
        setImageTitle(name);

        trackPaletteExtracted({
          colors_count: extracted.length,
          source: isSample ? 'sample' : 'upload',
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to parse image colors';
        setErrorMessage(msg);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  // Multi-image processing handler (up to 10 images)
  const handleProcessMultipleFiles = useCallback(
    (files: FileList | File[]) => {
      setErrorMessage(null);
      const fileArr = Array.from(files).slice(0, 10);
      if (fileArr.length === 0) return;

      const loadedItems: MultiImageItem[] = [];

      fileArr.forEach((file) => {
        if (file.size > MAX_FILE_SIZE_BYTES) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          const img = new Image();
          img.onload = () => {
            const offscreen = document.createElement('canvas');
            offscreen.width = img.naturalWidth || img.width || 800;
            offscreen.height = img.naturalHeight || img.height || 600;
            const ctx = offscreen.getContext('2d');
            let pal: ColorSwatch[] = [];
            if (ctx) {
              ctx.drawImage(img, 0, 0, offscreen.width, offscreen.height);
              pal = extractPaletteFromCanvas(offscreen, colorCount);
            }

            const item: MultiImageItem = {
              id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: file.name,
              img,
              objectUrl: dataUrl,
              palette: pal,
            };

            loadedItems.push(item);
            if (loadedItems.length === fileArr.length) {
              setImageList((prev) => [...prev, ...loadedItems].slice(0, 10));
              if (loadedItems[0]) {
                setImageElement(loadedItems[0].img);
                setImageTitle(loadedItems[0].name);
                setSwatches(loadedItems[0].palette);
                setActiveImageIndex(0);
              }
            }
          };
          img.src = dataUrl;
        };
        reader.readAsDataURL(file);
      });
    },
    [colorCount]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        handleProcessMultipleFiles(e.target.files);
      } else {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => processImage(img, file.name, colorCount, false);
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      if (e.dataTransfer.files.length > 1) {
        handleProcessMultipleFiles(e.dataTransfer.files);
      } else {
        const file = e.dataTransfer.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = new Image();
          img.onload = () => processImage(img, file.name, colorCount, false);
          img.src = ev.target?.result as string;
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleLoadSample = () => {
    const sampleCanvas = createSamplePhotoCanvas();
    const dataUrl = sampleCanvas.toDataURL('image/jpeg', 0.9);
    const img = new Image();
    img.onload = () => {
      processImage(img, SAMPLE_PHOTO_NAME, colorCount, true);
    };
    img.src = dataUrl;
  };

  const handleCountChange = (count: 3 | 5 | 8 | 12) => {
    setColorCount(count);
    if (imageElement) {
      processImage(imageElement, imageTitle, count, false);
    }
  };

  const handleCopySingle = (hex: string, id: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedId(id);
  };

  // Copy CSS Variables
  const handleCopyCssVariables = () => {
    if (swatches.length === 0) return;
    const css = generateCssVariablesCode(swatches);
    navigator.clipboard.writeText(css);
    trackPaletteExported('css', swatches.length);
    setFeedbackToast('CSS variables copied to clipboard!');
  };

  // Copy Tailwind Config
  const handleCopyTailwind = () => {
    if (swatches.length === 0) return;
    const tailwind = generateTailwindConfigCode(swatches);
    navigator.clipboard.writeText(tailwind);
    trackPaletteExported('tailwind', swatches.length);
    setFeedbackToast('Tailwind config snippet copied to clipboard!');
  };

  // Download JSON
  const handleDownloadJson = () => {
    if (swatches.length === 0) return;
    const jsonStr = generateJsonCode(swatches);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageTitle.replace(/\.[^/.]+$/, '') || 'palette'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackPaletteExported('json', swatches.length);
    setFeedbackToast('Downloaded JSON palette!');
  };

  // Download PNG Strip
  const handleDownloadPng = async () => {
    if (swatches.length === 0) return;
    try {
      const blob = await generatePalettePng(swatches, imageTitle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${imageTitle.replace(/\.[^/.]+$/, '') || 'palette'}-swatches.png`;
      a.click();
      URL.revokeObjectURL(url);
      trackDownloadPalette({ format: 'png', colors_count: swatches.length });
    } catch (_) {}
  };

  // Download TXT
  const handleDownloadTxt = () => {
    if (swatches.length === 0) return;
    const text = generatePaletteTxt(swatches, imageTitle);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${imageTitle.replace(/\.[^/.]+$/, '') || 'palette'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    trackDownloadPalette({ format: 'txt', colors_count: swatches.length });
  };

  // Save palette to localStorage
  const handleSavePalette = () => {
    if (swatches.length === 0) return;
    const newEntry: SavedPaletteItem = {
      id: `pal-${Date.now()}`,
      name: imageTitle || `Palette #${savedPalettes.length + 1}`,
      hexes: swatches.map((s) => s.hex),
      swatches: [...swatches],
      date: new Date().toISOString().split('T')[0],
    };
    const updated = [newEntry, ...savedPalettes.slice(0, 19)];
    setSavedPalettes(updated);
    try {
      localStorage.setItem('tools_saved_palettes', JSON.stringify(updated));
    } catch (_) {}
    setFeedbackToast('Palette saved to browser storage!');
  };

  const handleLoadSavedPalette = (item: SavedPaletteItem) => {
    setSwatches(item.swatches);
    setImageTitle(item.name);
    setFeedbackToast(`Loaded "${item.name}"`);
  };

  const handleDeleteSavedPalette = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedPalettes.filter((p) => p.id !== id);
    setSavedPalettes(updated);
    try {
      localStorage.setItem('tools_saved_palettes', JSON.stringify(updated));
    } catch (_) {}
  };

  // Share link with URL hash
  const handleCopyShareLink = () => {
    if (swatches.length === 0) return;
    const hexParam = swatches.map((s) => s.hex.replace('#', '')).join(',');
    const shareUrl = `${window.location.origin}${window.location.pathname}#palette=${hexParam}`;
    navigator.clipboard.writeText(shareUrl);
    setFeedbackToast('Shareable URL copied! Opening this link restores your palette.');
  };

  // Gradient Builder CSS
  const activeGradientColors = gradientIndices
    .map((idx) => swatches[idx]?.hex)
    .filter(Boolean);
  const gradientCss =
    activeGradientColors.length >= 2
      ? `linear-gradient(${gradientAngle}deg, ${activeGradientColors.join(', ')})`
      : 'linear-gradient(135deg, #5846F6, #D4FF3A)';

  const handleCopyGradient = () => {
    const cssRule = `background: ${gradientCss};`;
    navigator.clipboard.writeText(cssRule);
    trackGradientCopied(cssRule, activeGradientColors.length);
    setFeedbackToast('Gradient CSS rule copied to clipboard!');
  };

  // Harmony Suggestions based on primary/first swatch
  const primarySwatch = swatches[0];
  const harmonies = primarySwatch ? generateHarmonies(primarySwatch) : null;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 space-y-8">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full bg-[#5846F6]/10 px-3.5 py-1 text-xs font-bold text-[#5846F6] border border-[#5846F6]/20">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Phase 2 Enhanced • WCAG Contrast • Gradient Builder • 100% Free</span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-[#0B0B0D]">
          Color Palette Extractor & Harmony Kit
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#4F4E55] leading-relaxed">
          Extract 3, 5, 8, or 12 harmonious color swatches from any photo. Copy CSS variables,
          Tailwind snippets, check WCAG contrast, and build CSS gradients in seconds.
        </p>
      </div>

      {/* Notifications */}
      {errorMessage && (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1 font-semibold">{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {feedbackToast && (
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs sm:text-sm text-emerald-900 shadow-xs">
          <Check className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
          <div className="flex-1 font-semibold">{feedbackToast}</div>
        </div>
      )}

      {/* MAIN WORKSPACE */}
      <div className="rounded-3xl border border-[#C9C7C1] bg-white p-5 sm:p-7 md:p-8 shadow-xs space-y-8">
        {/* Upload Zone */}
        {swatches.length === 0 ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all ${
              isDragging
                ? "border-[#5846F6] bg-[#5846F6]/5 scale-[1.01]"
                : "border-[#C9C7C1] bg-[#F4F2EC]/40 hover:bg-[#F4F2EC] hover:border-[#5846F6]"
            }`}
          >
            <div className="max-w-md mx-auto space-y-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-2xl bg-white text-[#5846F6] shadow-xs border border-[#C9C7C1]">
                {isProcessing ? (
                  <RefreshCw className="h-8 w-8 animate-spin" />
                ) : (
                  <UploadCloud className="h-8 w-8" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-base sm:text-lg font-bold text-[#0B0B0D]">
                  Drag and drop your image(s) here
                </p>
                <p className="text-xs sm:text-sm text-[#4F4E55]">
                  Accepts JPG, PNG, WebP, SVG up to 10 MB • Drop up to 10 images at once
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#5846F6] hover:bg-[#4735E2] text-white px-6 py-3 text-sm font-bold transition-all shadow-md cursor-pointer"
                >
                  <UploadCloud className="h-4 w-4" />
                  <span>Browse Images</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[#C9C7C1] bg-white hover:bg-[#F4F2EC] text-[#0B0B0D] px-5 py-3 text-sm font-semibold transition-all shadow-2xs"
                >
                  <Sparkles className="h-4 w-4 text-[#5846F6]" />
                  <span>Try a sample photo</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ACTIVE PALETTE VIEW */
          <div className="space-y-8">
            {/* Top Toolbar: Swatch Count & Multi-Image Strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#C9C7C1] pb-4">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#4F4E55]">
                  Swatch Count:
                </span>
                <div className="flex items-center gap-1 bg-[#F4F2EC] p-1 rounded-xl border border-[#C9C7C1]/60">
                  {([3, 5, 8, 12] as (3 | 5 | 8 | 12)[]).map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleCountChange(cnt)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        colorCount === cnt
                          ? "bg-[#5846F6] text-white shadow-xs"
                          : "text-[#4F4E55] hover:text-[#0B0B0D]"
                      }`}
                    >
                      {cnt} Colors
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C9C7C1] bg-white px-3.5 py-1.5 text-xs font-bold text-[#0B0B0D] hover:bg-[#F4F2EC]"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-[#5846F6]" />
                  <span>New Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePalette}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C9C7C1] bg-white px-3.5 py-1.5 text-xs font-bold text-[#0B0B0D] hover:bg-[#F4F2EC]"
                >
                  <Bookmark className="h-3.5 w-3.5 text-[#5846F6]" />
                  <span>Save Palette</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#C9C7C1] bg-white px-3.5 py-1.5 text-xs font-bold text-[#0B0B0D] hover:bg-[#F4F2EC]"
                >
                  <Share2 className="h-3.5 w-3.5 text-[#5846F6]" />
                  <span>Share URL</span>
                </button>
              </div>
            </div>

            {/* Multi-Image Switcher Strip if > 1 loaded */}
            {imageList.length > 1 && (
              <div className="p-3 bg-[#F4F2EC] rounded-2xl border border-[#C9C7C1] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-[#0B0B0D]">
                  <span className="flex items-center gap-1.5">
                    <Layers className="h-3.5 w-3.5 text-[#5846F6]" />
                    <span>Multi-Image Mode ({imageList.length} images)</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {imageList.map((item, idx) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveImageIndex(idx);
                        setImageElement(item.img);
                        setImageTitle(item.name);
                        setSwatches(item.palette);
                      }}
                      className={`flex items-center gap-2 rounded-xl p-1.5 text-xs font-semibold shrink-0 transition-all border ${
                        idx === activeImageIndex
                          ? "border-[#5846F6] bg-white text-[#5846F6] ring-2 ring-[#5846F6]/20 shadow-xs"
                          : "border-[#C9C7C1] bg-white/70 text-[#4F4E55] hover:bg-white"
                      }`}
                    >
                      <img
                        src={item.objectUrl}
                        alt={item.name}
                        className="h-7 w-7 object-cover rounded-md"
                      />
                      <span className="max-w-[100px] truncate">{item.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* BIG PALETTE STRIP SWATCHES */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {swatches.map((swatch, idx) => {
                  const isCopied = copiedId === swatch.id;
                  const contrast = getWcagContrast(swatch.rgb[0], swatch.rgb[1], swatch.rgb[2]);

                  return (
                    <div
                      key={swatch.id}
                      className="rounded-2xl border border-[#C9C7C1] bg-white overflow-hidden shadow-2xs group transition-all hover:shadow-md"
                    >
                      {/* Color block */}
                      <div
                        onClick={() => handleCopySingle(swatch.hex, swatch.id)}
                        className="relative h-28 w-full cursor-pointer flex items-center justify-center transition-transform group-hover:scale-[1.02]"
                        style={{ backgroundColor: swatch.hex }}
                      >
                        <span
                          className="opacity-0 group-hover:opacity-100 transition-opacity px-2.5 py-1 rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1"
                          style={{
                            backgroundColor: swatch.textColor === '#FFFFFF' ? '#0B0B0D' : '#FFFFFF',
                            color: swatch.textColor === '#FFFFFF' ? '#FFFFFF' : '#0B0B0D',
                          }}
                        >
                          {isCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                          <span>{isCopied ? 'Copied' : 'Copy'}</span>
                        </span>
                      </div>

                      {/* Info & Contrast metrics */}
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-[#0B0B0D]">
                            {swatch.hex}
                          </span>
                          <span className="text-[10px] text-[#4F4E55]">
                            #{idx + 1}
                          </span>
                        </div>

                        {/* WCAG Contrast Badge */}
                        {showContrast && (
                          <div className="pt-2 border-t border-[#C9C7C1]/40 flex items-center justify-between text-[10px]">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                contrast.aaWhite
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                              title={`Contrast vs White: ${contrast.ratioWhite}:1`}
                            >
                              W: {contrast.ratioWhite}:1 {contrast.aaWhite ? 'AA' : ''}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                contrast.aaBlack
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-neutral-100 text-neutral-600'
                              }`}
                              title={`Contrast vs Black: ${contrast.ratioBlack}:1`}
                            >
                              B: {contrast.ratioBlack}:1 {contrast.aaBlack ? 'AA' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CODE EXPORT TOOLBAR */}
            <div className="rounded-2xl border border-[#C9C7C1] bg-[#F4F2EC] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0B0B0D] flex items-center gap-1.5">
                <Code className="h-4 w-4 text-[#5846F6]" />
                <span>Phase 2 Code Exports:</span>
              </span>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyCssVariables}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9C7C1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B0B0D] hover:border-[#5846F6] hover:text-[#5846F6] transition-all shadow-2xs"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy CSS Variables</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyTailwind}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9C7C1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B0B0D] hover:border-[#5846F6] hover:text-[#5846F6] transition-all shadow-2xs"
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Copy Tailwind Config</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9C7C1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B0B0D] hover:border-[#5846F6] hover:text-[#5846F6] transition-all shadow-2xs"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9C7C1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B0B0D] hover:border-[#5846F6] hover:text-[#5846F6] transition-all shadow-2xs"
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>PNG Strip</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#C9C7C1] bg-white px-3 py-1.5 text-xs font-bold text-[#0B0B0D] hover:border-[#5846F6] hover:text-[#5846F6] transition-all shadow-2xs"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Palette TXT</span>
                </button>
              </div>
            </div>

            {/* GRADIENT BUILDER (Phase 2) */}
            <div className="rounded-3xl border border-[#C9C7C1] bg-white p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-extrabold text-[#0B0B0D] flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#5846F6]" />
                    <span>Gradient Builder</span>
                  </h3>
                  <p className="text-xs text-[#4F4E55]">
                    Build multi-stop CSS gradients from your extracted colors.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyGradient}
                  className="inline-flex items-center gap-2 rounded-full bg-[#5846F6] hover:bg-[#4735E2] text-white px-4 py-2 text-xs font-bold shadow-md transition-all self-start sm:self-center"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy CSS Gradient</span>
                </button>
              </div>

              {/* Live Gradient Preview Bar */}
              <div
                className="h-16 w-full rounded-2xl shadow-inner border border-[#C9C7C1] transition-all"
                style={{ background: gradientCss }}
              />

              {/* Controls: Swatch Selector & Angle Slider */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center pt-2">
                <div>
                  <label className="text-xs font-bold text-[#4F4E55] block mb-2">
                    Pick 2 or 3 Gradient Colors:
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {swatches.map((swatch, idx) => {
                      const isPicked = gradientIndices.includes(idx);
                      return (
                        <button
                          key={swatch.id}
                          type="button"
                          onClick={() => {
                            if (isPicked) {
                              if (gradientIndices.length > 2) {
                                setGradientIndices(gradientIndices.filter((i) => i !== idx));
                              }
                            } else {
                              if (gradientIndices.length < 3) {
                                setGradientIndices([...gradientIndices, idx]);
                              } else {
                                setGradientIndices([gradientIndices[1], idx]);
                              }
                            }
                          }}
                          className={`h-7 w-7 rounded-full border-2 transition-transform ${
                            isPicked
                              ? 'scale-110 border-[#5846F6] ring-2 ring-[#5846F6]/30 shadow-xs'
                              : 'border-white opacity-70 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: swatch.hex }}
                          title={`Color ${idx + 1}: ${swatch.hex}`}
                        />
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-[#4F4E55] mb-1">
                    <span>Angle: <strong>{gradientAngle}°</strong></span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={gradientAngle}
                    onChange={(e) => setGradientAngle(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-neutral-200 accent-[#5846F6] cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* HARMONY SUGGESTIONS (Phase 2) */}
            {harmonies && (
              <div className="rounded-3xl border border-[#C9C7C1] bg-white p-6 space-y-4 shadow-xs">
                <div>
                  <h3 className="text-base font-extrabold text-[#0B0B0D]">
                    Color Harmony Suggestions
                  </h3>
                  <p className="text-xs text-[#4F4E55]">
                    Generated from your primary color ({primarySwatch.hex}). Click any mini-palette to load into active view.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Complementary */}
                  <div
                    onClick={() => {
                      setSwatches(harmonies.complementary);
                      setFeedbackToast('Loaded Complementary harmony palette!');
                    }}
                    className="cursor-pointer rounded-2xl border border-[#C9C7C1] p-4 hover:border-[#5846F6] transition-all bg-[#F4F2EC]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B0B0D]">Complementary</span>
                      <span className="text-[10px] text-[#5846F6] font-semibold">Load</span>
                    </div>
                    <div className="h-10 w-full rounded-xl overflow-hidden flex shadow-2xs">
                      {harmonies.complementary.map((s, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: s.hex }} />
                      ))}
                    </div>
                  </div>

                  {/* Analogous */}
                  <div
                    onClick={() => {
                      setSwatches(harmonies.analogous);
                      setFeedbackToast('Loaded Analogous harmony palette!');
                    }}
                    className="cursor-pointer rounded-2xl border border-[#C9C7C1] p-4 hover:border-[#5846F6] transition-all bg-[#F4F2EC]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B0B0D]">Analogous</span>
                      <span className="text-[10px] text-[#5846F6] font-semibold">Load</span>
                    </div>
                    <div className="h-10 w-full rounded-xl overflow-hidden flex shadow-2xs">
                      {harmonies.analogous.map((s, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: s.hex }} />
                      ))}
                    </div>
                  </div>

                  {/* Triadic */}
                  <div
                    onClick={() => {
                      setSwatches(harmonies.triadic);
                      setFeedbackToast('Loaded Triadic harmony palette!');
                    }}
                    className="cursor-pointer rounded-2xl border border-[#C9C7C1] p-4 hover:border-[#5846F6] transition-all bg-[#F4F2EC]/40 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0B0B0D]">Triadic</span>
                      <span className="text-[10px] text-[#5846F6] font-semibold">Load</span>
                    </div>
                    <div className="h-10 w-full rounded-xl overflow-hidden flex shadow-2xs">
                      {harmonies.triadic.map((s, i) => (
                        <div key={i} className="flex-1 h-full" style={{ backgroundColor: s.hex }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SAVED PALETTES TRAY (Phase 2) */}
            {savedPalettes.length > 0 && (
              <div className="rounded-3xl border border-[#C9C7C1] bg-[#F4F2EC] p-6 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[#0B0B0D] flex items-center gap-1.5">
                  <Bookmark className="h-4 w-4 text-[#5846F6]" />
                  <span>Saved Palettes ({savedPalettes.length})</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {savedPalettes.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleLoadSavedPalette(item)}
                      className="cursor-pointer rounded-2xl bg-white border border-[#C9C7C1] p-3 flex items-center justify-between gap-3 hover:border-[#5846F6] shadow-2xs"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0B0B0D] truncate">{item.name}</p>
                        <p className="text-[10px] text-[#4F4E55]">{item.date}</p>
                        <div className="flex items-center gap-1 mt-1.5">
                          {item.hexes.slice(0, 5).map((h, i) => (
                            <div
                              key={i}
                              className="h-3 w-3 rounded-full border border-neutral-200"
                              style={{ backgroundColor: h }}
                            />
                          ))}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedPalette(item.id, e)}
                        className="text-neutral-400 hover:text-red-500 p-1"
                        title="Delete saved palette"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PRIVACY BADGE */}
      <div className="rounded-2xl border border-[#C9C7C1] bg-white p-4 text-center max-w-xl mx-auto flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-[#0B0B0D]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#5846F6]" />
        <span>100% private. All color extraction runs in your browser. No images are uploaded.</span>
      </div>
    </div>
  );
}
