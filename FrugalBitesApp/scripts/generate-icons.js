/**
 * Generate FrugalBites App Icons
 * Run with: node scripts/generate-icons.js
 */

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

// Theme colors
const colors = {
  primary: '#16a34a',      // Green - eco
  primaryLight: '#22c55e',
  secondary: '#f59e0b',    // Amber - savings
  white: '#ffffff',
  dark: '#166534',
};

function drawIcon(ctx, size, isAdaptive = false) {
  const center = size / 2;
  const padding = isAdaptive ? size * 0.2 : size * 0.1;
  const iconSize = size - (padding * 2);
  
  // Background
  if (!isAdaptive) {
    // Rounded rectangle background for regular icon
    const radius = size * 0.22;
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.quadraticCurveTo(size, 0, size, radius);
    ctx.lineTo(size, size - radius);
    ctx.quadraticCurveTo(size, size, size - radius, size);
    ctx.lineTo(radius, size);
    ctx.quadraticCurveTo(0, size, 0, size - radius);
    ctx.lineTo(0, radius);
    ctx.quadraticCurveTo(0, 0, radius, 0);
    ctx.closePath();
    ctx.fill();
  } else {
    // Solid background for adaptive icon
    ctx.fillStyle = colors.primary;
    ctx.fillRect(0, 0, size, size);
  }

  // Draw a stylized leaf/plant with a price tag
  const leafCenterX = center;
  const leafCenterY = center - iconSize * 0.05;
  const leafSize = iconSize * 0.35;

  // Main leaf shape
  ctx.fillStyle = colors.white;
  ctx.beginPath();
  
  // Leaf body
  ctx.moveTo(leafCenterX, leafCenterY - leafSize);
  ctx.bezierCurveTo(
    leafCenterX + leafSize * 0.8, leafCenterY - leafSize * 0.5,
    leafCenterX + leafSize * 0.8, leafCenterY + leafSize * 0.5,
    leafCenterX, leafCenterY + leafSize * 0.3
  );
  ctx.bezierCurveTo(
    leafCenterX - leafSize * 0.8, leafCenterY + leafSize * 0.5,
    leafCenterX - leafSize * 0.8, leafCenterY - leafSize * 0.5,
    leafCenterX, leafCenterY - leafSize
  );
  ctx.fill();

  // Leaf stem
  ctx.strokeStyle = colors.white;
  ctx.lineWidth = iconSize * 0.04;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(leafCenterX, leafCenterY + leafSize * 0.3);
  ctx.lineTo(leafCenterX, leafCenterY + leafSize * 0.8);
  ctx.stroke();

  // Leaf veins
  ctx.lineWidth = iconSize * 0.02;
  ctx.beginPath();
  ctx.moveTo(leafCenterX, leafCenterY - leafSize * 0.6);
  ctx.lineTo(leafCenterX, leafCenterY + leafSize * 0.2);
  ctx.stroke();

  // Side veins
  ctx.beginPath();
  ctx.moveTo(leafCenterX, leafCenterY - leafSize * 0.3);
  ctx.lineTo(leafCenterX + leafSize * 0.4, leafCenterY - leafSize * 0.15);
  ctx.moveTo(leafCenterX, leafCenterY - leafSize * 0.3);
  ctx.lineTo(leafCenterX - leafSize * 0.4, leafCenterY - leafSize * 0.15);
  ctx.moveTo(leafCenterX, leafCenterY);
  ctx.lineTo(leafCenterX + leafSize * 0.35, leafCenterY + leafSize * 0.1);
  ctx.moveTo(leafCenterX, leafCenterY);
  ctx.lineTo(leafCenterX - leafSize * 0.35, leafCenterY + leafSize * 0.1);
  ctx.stroke();

  // Price tag / savings indicator (small circle with %)
  const tagX = leafCenterX + leafSize * 0.6;
  const tagY = leafCenterY - leafSize * 0.4;
  const tagRadius = iconSize * 0.12;

  // Tag circle
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(tagX, tagY, tagRadius, 0, Math.PI * 2);
  ctx.fill();

  // % symbol in tag
  ctx.fillStyle = colors.white;
  ctx.font = `bold ${tagRadius * 1.1}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('%', tagX, tagY + 1);
}

function drawSplash(ctx, size) {
  const center = size / 2;

  // White background
  ctx.fillStyle = '#f0fdf4'; // Light eco green tint
  ctx.fillRect(0, 0, size, size);

  // Draw icon in center (smaller)
  const iconSize = size * 0.3;
  
  ctx.save();
  ctx.translate(center - iconSize / 2, center - iconSize / 2);
  
  // Create a temporary canvas for the icon
  const iconCanvas = createCanvas(iconSize, iconSize);
  const iconCtx = iconCanvas.getContext('2d');
  drawIcon(iconCtx, iconSize, false);
  
  ctx.drawImage(iconCanvas, 0, 0);
  ctx.restore();

  // App name below icon
  ctx.fillStyle = colors.primary;
  ctx.font = `bold ${size * 0.06}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('FrugalBites', center, center + iconSize * 0.5 + size * 0.05);

  // Tagline
  ctx.fillStyle = colors.dark;
  ctx.font = `${size * 0.025}px Arial`;
  ctx.fillText('Save food. Save money.', center, center + iconSize * 0.5 + size * 0.1);
}

function generateIcon(filename, size, drawFn = drawIcon, ...args) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  drawFn(ctx, size, ...args);
  
  const buffer = canvas.toBuffer('image/png');
  const filepath = path.join(ASSETS_DIR, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ Generated ${filename} (${size}x${size})`);
}

// Generate all icons
console.log('\n🎨 Generating FrugalBites app icons...\n');

generateIcon('icon.png', 1024, drawIcon, false);
generateIcon('adaptive-icon.png', 1024, drawIcon, true);
generateIcon('favicon.png', 48, drawIcon, false);
generateIcon('splash-icon.png', 1024, drawSplash);

console.log('\n✅ All icons generated successfully!\n');
