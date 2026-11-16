/**
 * High-resolution embedded sample graphic designed for testing color extraction.
 * Features a rich color spectrum: vibrant teal, warm sunset coral, golden amber,
 * deep slate navy, terracotta, and soft ivory cream.
 */
export const SAMPLE_PHOTO_NAME = 'sunset-coastal-sample.png';

export function createSamplePhotoCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 667;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Sky gradient: coral pink to golden amber to sky
  const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
  skyGrad.addColorStop(0, '#E06D53'); // Coral
  skyGrad.addColorStop(0.4, '#F2A057'); // Orange peach
  skyGrad.addColorStop(0.75, '#E5A93C'); // Golden amber
  skyGrad.addColorStop(1, '#F7E7CE'); // Soft cream
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, 1000, 360);

  // Glowing sun
  const sunGrad = ctx.createRadialGradient(720, 220, 10, 720, 220, 90);
  sunGrad.addColorStop(0, '#FFF5EA');
  sunGrad.addColorStop(0.5, '#FBD38D');
  sunGrad.addColorStop(1, 'rgba(251, 211, 141, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(720, 220, 90, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountain ranges: muted slate navy
  ctx.fillStyle = '#2D3E4E';
  ctx.beginPath();
  ctx.moveTo(0, 320);
  ctx.lineTo(160, 260);
  ctx.lineTo(340, 310);
  ctx.lineTo(520, 250);
  ctx.lineTo(680, 290);
  ctx.lineTo(840, 240);
  ctx.lineTo(1000, 300);
  ctx.lineTo(1000, 420);
  ctx.lineTo(0, 420);
  ctx.closePath();
  ctx.fill();

  // Ocean water: deep teal to vibrant tropical teal
  const waterGrad = ctx.createLinearGradient(0, 320, 0, 560);
  waterGrad.addColorStop(0, '#155E54'); // Deep dark teal
  waterGrad.addColorStop(0.4, '#1F8C7F'); // Signature vibrant teal
  waterGrad.addColorStop(0.85, '#28A798'); // Lighter aqua teal
  waterGrad.addColorStop(1, '#48C4B5'); // Bright surf
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 320, 1000, 240);

  // Foreground coastline rocks & shore: deep navy slate & earthy terracotta
  ctx.fillStyle = '#1B2631'; // Dark slate
  ctx.beginPath();
  ctx.moveTo(0, 460);
  ctx.bezierCurveTo(180, 470, 280, 530, 420, 560);
  ctx.bezierCurveTo(580, 590, 700, 580, 1000, 620);
  ctx.lineTo(1000, 667);
  ctx.lineTo(0, 667);
  ctx.closePath();
  ctx.fill();

  // Warm shoreline sand & foliage highlights: terracotta & golden sand
  ctx.fillStyle = '#A35438'; // Terracotta
  ctx.beginPath();
  ctx.moveTo(0, 560);
  ctx.bezierCurveTo(220, 570, 360, 620, 620, 640);
  ctx.lineTo(600, 667);
  ctx.lineTo(0, 667);
  ctx.closePath();
  ctx.fill();

  return canvas;
}
