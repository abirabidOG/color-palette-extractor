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
} from 'lucide-react';
import {
  ColorSwatch,
  extractPaletteFromCanvas,
  rgbToHex,
  hexToRgb,
  getLuminance,
  getContrastTextColor,
  generatePalettePng,
  generatePaletteTxt,
} from '../lib/paletteExtractor';
import { createSamplePhotoCanvas, SAMPLE_PHOTO_NAME } from '../lib/samplePhoto';
import { trackPaletteExtracted, trackDownloadPalette } from '../lib/analytics';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
];

export default function ColorPaletteTool() {
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [colorCount, setColorCount] = useState<3 | 5 | 8>(5);
  const [imageTitle, setImageTitle] = useState<string>('');
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Clear copied notification after 2 seconds
  useEffect(() => {
    if (!copiedId && !copiedAll) return;
    const timer = setTimeout(() => {
      setCopiedId(null);
      setCopiedAll(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [copiedId, copiedAll]);

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
    (img: HTMLImageElement, name: string, count: 3 | 5 | 8, isSample: boolean = false) => {
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

  const handleFile = useCallback(
    (file: File) => {
      setErrorMessage(null);

      // Validate size
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `File is too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Please select an image under 10 MB.`
        );
        return;
      }

      // Validate format
      const isAllowedType =
        ALLOWED_MIME_TYPES.includes(file.type) ||
        /\.(jpe?g|png|webp|svg)$/i.test(file.name);

      if (!isAllowedType) {
        setErrorMessage(
          'Unsupported file format. Please upload a JPG, PNG, WebP, or SVG image.'
        );
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          processImage(img, file.name, colorCount, false);
        };
        img.onerror = () => {
          setErrorMessage('Could not load image file. The file may be corrupted.');
        };
        img.src = dataUrl;
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    },
    [colorCount, processImage]
  );

  const handleColorCountChange = (newCount: 3 | 5 | 8) => {
    setColorCount(newCount);
    if (imageElement) {
      processImage(imageElement, imageTitle, newCount, false);
    }
  };

  const handleSampleClick = () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const sampleCanvas = createSamplePhotoCanvas();
      const dataUrl = sampleCanvas.toDataURL('image/png');
      const img = new Image();
      img.onload = () => {
        processImage(img, SAMPLE_PHOTO_NAME, colorCount, true);
      };
      img.src = dataUrl;
    } catch {
      setErrorMessage('Could not generate sample photo.');
      setIsProcessing(false);
    }
  };

  // Click-to-pick from preview canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    if (swatches.length >= 8) {
      setErrorMessage('Maximum of 8 colors reached. Remove a swatch to add another.');
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.min(canvas.width - 1, Math.max(0, Math.floor((e.clientX - rect.left) * scaleX)));
    const y = Math.min(canvas.height - 1, Math.max(0, Math.floor((e.clientY - rect.top) * scaleY)));

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] < 30) {
      setErrorMessage('Clicked on a transparent area. Please click on a visible colored pixel.');
      return;
    }

    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    const hex = rgbToHex(r, g, b);

    // If color already exists, highlight it
    const existing = swatches.find((s) => s.hex.toLowerCase() === hex.toLowerCase());
    if (existing) {
      handleCopy(existing.hex, existing.id);
      return;
    }

    const lum = getLuminance(r, g, b);
    const newSwatch: ColorSwatch = {
      id: `picked-${Date.now()}-${hex}`,
      hex,
      rgb: [r, g, b],
      rgbString: `rgb(${r}, ${g}, ${b})`,
      luminance: lum,
      textColor: getContrastTextColor(r, g, b),
      isPicked: true,
    };

    setSwatches((prev) => [...prev, newSwatch]);
    setCopiedId(newSwatch.id);
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
  };

  const handleCopyAll = () => {
    if (swatches.length === 0) return;
    const allHex = swatches.map((s) => s.hex).join(', ');
    if (navigator.clipboard) {
      navigator.clipboard.writeText(allHex);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = allHex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedAll(true);
  };

  const handleDownloadPng = async () => {
    if (swatches.length === 0) return;
    try {
      const blob = await generatePalettePng(swatches, imageTitle || 'Color Palette');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `color-palette-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      trackDownloadPalette({
        format: 'png',
        colors_count: swatches.length,
      });
    } catch {
      setErrorMessage('Failed to generate PNG palette strip.');
    }
  };

  const handleDownloadTxt = () => {
    if (swatches.length === 0) return;
    try {
      const text = generatePaletteTxt(swatches);
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `color-palette-${Date.now()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      trackDownloadPalette({
        format: 'txt',
        colors_count: swatches.length,
      });
    } catch {
      setErrorMessage('Failed to generate TXT file.');
    }
  };

  const handleRemoveSwatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (swatches.length <= 2) {
      setErrorMessage('At least 2 colors are needed in the palette.');
      return;
    }
    setSwatches((prev) => prev.filter((s) => s.id !== id));
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
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleReset = () => {
    setSwatches([]);
    setImageElement(null);
    setImageTitle('');
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      {/* Error notification banner */}
      {errorMessage && (
        <div
          role="alert"
          className="mb-6 flex items-start justify-between rounded-2xl border border-red-200 bg-red-50/90 p-4 text-red-900 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="rounded-lg p-1 text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Dismiss error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Tool Container */}
      {!imageElement ? (
        /* Empty Upload State */
        <div className="rounded-3xl border border-[#E5E1D6] bg-white p-6 sm:p-10 shadow-sm">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center transition-all ${
              isDragging
                ? 'border-[#1F8C7F] bg-[#EBF7F5]'
                : 'border-[#E5E1D6] hover:border-[#1F8C7F] hover:bg-[#F4F2EC]/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F4F2EC] text-[#1F8C7F] mb-5 shadow-2xs">
              <UploadCloud className="h-8 w-8" />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0B0B0D]">
              Drop your photo, illustration, or logo here
            </h3>
            <p className="mt-2 text-sm text-[#4F4E55] max-w-md mx-auto">
              Supports <strong className="text-[#0B0B0D]">JPG, PNG, WebP</strong> and{' '}
              <strong className="text-[#0B0B0D]">SVG</strong> up to 10 MB.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[#0B0B0D] hover:bg-[#1F8C7F] text-white px-6 py-2.5 text-sm font-semibold transition-all shadow-sm"
              >
                Browse Image
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSampleClick();
                }}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] px-5 py-2.5 text-sm font-semibold text-[#0B0B0D] transition-all shadow-2xs"
              >
                <Sparkles className="h-4 w-4 text-[#1F8C7F]" />
                Try a sample photo
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Workspace State with Image & Palette */
        <div className="space-y-8">
          {/* Top Bar: Title & Change Image */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E5E1D6] bg-white p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F2EC] text-[#1F8C7F]">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#0B0B0D] truncate">
                  {imageTitle || 'Uploaded Image'}
                </p>
                <p className="text-xs text-[#4F4E55]">
                  Processed 100% in your browser • Click on image to sample colors
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] px-3.5 py-2 text-xs font-semibold text-[#0B0B0D] transition-all"
              >
                <RefreshCw className="h-3.5 w-3.5 text-[#4F4E55]" />
                Change Image
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-[#E5E1D6] bg-white hover:bg-red-50 hover:text-red-700 hover:border-red-200 px-3 py-2 text-xs font-semibold text-[#4F4E55] transition-all"
                aria-label="Remove image and reset"
              >
                <X className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
            </div>
          </div>

          {/* Controls Bar: Palette Count Selection & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 rounded-2xl border border-[#E5E1D6] bg-[#F4F2EC] p-4 sm:p-5">
            {/* Color Count Toggle (3, 5, 8) */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[#4F4E55] font-semibold">
                Colors:
              </span>
              <div className="inline-flex rounded-xl border border-[#E5E1D6] bg-white p-1 shadow-2xs">
                {([3, 5, 8] as const).map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => handleColorCountChange(count)}
                    className={`min-h-[36px] min-w-[44px] rounded-lg px-3 text-xs font-bold transition-all ${
                      colorCount === count
                        ? 'bg-[#0B0B0D] text-white shadow-xs'
                        : 'text-[#4F4E55] hover:text-[#0B0B0D]'
                    }`}
                  >
                    {count} {count === 5 ? '(Default)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Batch Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] px-3.5 py-2 text-xs font-semibold text-[#0B0B0D] transition-all shadow-2xs"
              >
                {copiedAll ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copied All!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-[#4F4E55]" />
                    <span>Copy All HEX</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadPng}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0B0B0D] hover:bg-[#1F8C7F] text-white px-4 py-2 text-xs font-bold transition-all shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG Strip</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadTxt}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#E5E1D6] bg-white hover:bg-[#F4F2EC] px-3.5 py-2 text-xs font-semibold text-[#0B0B0D] transition-all shadow-2xs"
              >
                <FileText className="h-4 w-4 text-[#4F4E55]" />
                <span>Download TXT</span>
              </button>
            </div>
          </div>

          {/* Swatches Display Grid */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="text-sm font-bold text-[#0B0B0D]">
                Extracted Palette ({swatches.length} colors)
              </h4>
              <span className="text-xs text-[#4F4E55]">
                Click any swatch or HEX code to copy
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
              {swatches.map((swatch) => {
                const isCopied = copiedId === swatch.id;
                return (
                  <div
                    key={swatch.id}
                    onClick={() => handleCopy(swatch.hex, swatch.id)}
                    className="group relative cursor-pointer overflow-hidden rounded-2xl border border-[#E5E1D6] bg-white shadow-2xs transition-all hover:scale-[1.02] hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1F8C7F]"
                    role="button"
                    tabIndex={0}
                    aria-label={`Copy color ${swatch.hex}`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleCopy(swatch.hex, swatch.id);
                      }
                    }}
                  >
                    {/* Color Swatch Block */}
                    <div
                      className="relative h-28 sm:h-36 w-full transition-transform"
                      style={{ backgroundColor: swatch.hex }}
                    >
                      {/* Badge if light, dark, or user-picked */}
                      {(swatch.isLight || swatch.isDark || swatch.isPicked) && (
                        <span
                          className="absolute top-2.5 left-2.5 z-10 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md shadow-2xs pointer-events-none"
                          style={{
                            backgroundColor:
                              swatch.luminance > 0.6
                                ? 'rgba(0,0,0,0.65)'
                                : 'rgba(255,255,255,0.85)',
                            color:
                              swatch.luminance > 0.6 ? '#FFFFFF' : '#0B0B0D',
                          }}
                        >
                          {swatch.isPicked
                            ? 'PICKED'
                            : swatch.isLight
                            ? 'LIGHT'
                            : 'DARK'}
                        </span>
                      )}

                      {/* Remove swatch button */}
                      {swatches.length > 2 && (
                        <button
                          type="button"
                          onClick={(e) => handleRemoveSwatch(swatch.id, e)}
                          className="absolute top-2 right-2 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-black/65 hover:bg-rose-600 text-white transition-all opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 shadow-sm cursor-pointer"
                          aria-label={`Remove color ${swatch.hex}`}
                          title="Remove color from palette"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}

                      {/* Hover / Click Copy Overlay */}
                      <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/25 pointer-events-none">
                        <div
                          className="rounded-full px-3 py-1 text-xs font-bold shadow-md flex items-center gap-1.5 pointer-events-auto"
                          style={{
                            backgroundColor: swatch.textColor,
                            color:
                              swatch.textColor === '#FFFFFF'
                                ? '#0B0B0D'
                                : '#FFFFFF',
                          }}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span>Copy HEX</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Color Metadata Details */}
                    <div className="p-3 sm:p-4 text-center">
                      <p className="font-mono text-sm sm:text-base font-bold text-[#0B0B0D] tracking-wide">
                        {swatch.hex}
                      </p>
                      <p className="font-mono text-[11px] sm:text-xs text-[#4F4E55] mt-0.5 truncate">
                        {swatch.rgbString}
                      </p>
                      {isCopied && (
                        <p className="mt-1 font-mono text-[11px] font-bold text-emerald-600 animate-pulse">
                          Copied to clipboard
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Image Preview with Eyedropper Sampling */}
          <div className="rounded-3xl border border-[#E5E1D6] bg-white p-5 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#E5E1D6]">
              <div className="flex items-center gap-2">
                <Pipette className="h-4 w-4 text-[#1F8C7F]" />
                <h4 className="text-sm font-bold text-[#0B0B0D]">
                  Interactive Image Preview
                </h4>
              </div>
              <p className="text-xs text-[#4F4E55]">
                Click anywhere on the image to pick a custom pixel swatch (up to 8 total)
              </p>
            </div>

            {/* Canvas Viewer */}
            <div className="relative mx-auto max-w-full overflow-hidden rounded-2xl border border-[#E5E1D6] bg-transparency-grid flex items-center justify-center p-2">
              <canvas
                ref={previewCanvasRef}
                onClick={handleCanvasClick}
                className="max-h-[500px] w-auto max-w-full cursor-crosshair rounded-lg object-contain transition-transform"
                title="Click anywhere to pick color swatch"
              />
            </div>
          </div>
        </div>
      )}

      {/* Privacy Badge */}
      <div className="mt-8 flex items-center justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E1D6] bg-[#F4F2EC] px-4 py-2 text-xs font-medium text-[#4F4E55]">
          <ShieldCheck className="h-4 w-4 text-[#1F8C7F]" />
          <span>
            100% private. Your image is processed in your browser and never uploaded.
          </span>
        </div>
      </div>
    </div>
  );
}
