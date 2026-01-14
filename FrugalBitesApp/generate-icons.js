const { createCanvas } = require('canvas');
const fs = require('fs');

// Create 1024x1024 icon
const size = 1024;
const canvas = createCanvas(size, size);
const ctx = canvas.getContext('2d');

// Background - gradient green
const gradient = ctx.createLinearGradient(0, 0, size, size);
gradient.addColorStop(0, '#22c55e');
gradient.addColorStop(1, '#16a34a');
ctx.fillStyle = gradient;

// Rounded rectangle background
const radius = 200;
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

// Draw a stylized leaf/bite shape
ctx.fillStyle = 'white';

// Main circle (representing food/plate)
ctx.beginPath();
ctx.arc(512, 520, 280, 0, Math.PI * 2);
ctx.fill();

// Bite taken out (creates the 'bite' effect)
ctx.fillStyle = '#16a34a';
ctx.beginPath();
ctx.arc(750, 350, 140, 0, Math.PI * 2);
ctx.fill();

// Leaf on top (eco symbol)
ctx.fillStyle = '#22c55e';
ctx.beginPath();
ctx.moveTo(512, 180);
ctx.quadraticCurveTo(620, 220, 650, 320);
ctx.quadraticCurveTo(600, 280, 512, 280);
ctx.quadraticCurveTo(424, 280, 374, 320);
ctx.quadraticCurveTo(404, 220, 512, 180);
ctx.fill();

// Leaf vein
ctx.strokeStyle = 'white';
ctx.lineWidth = 8;
ctx.beginPath();
ctx.moveTo(512, 200);
ctx.lineTo(512, 270);
ctx.stroke();

// Small veins
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(512, 225);
ctx.lineTo(480, 250);
ctx.moveTo(512, 225);
ctx.lineTo(544, 250);
ctx.moveTo(512, 245);
ctx.lineTo(490, 265);
ctx.moveTo(512, 245);
ctx.lineTo(534, 265);
ctx.stroke();

// Add 'FB' letters
ctx.fillStyle = '#16a34a';
ctx.font = 'bold 180px Arial';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';
ctx.fillText('FB', 512, 550);

// Save the icon
const buffer = canvas.toBuffer('image/png');
fs.writeFileSync('./assets/icon.png', buffer);
console.log('✓ Icon created!');

// Create adaptive icon (same but square corners for Android)
const adaptiveCanvas = createCanvas(size, size);
const actx = adaptiveCanvas.getContext('2d');

const agradient = actx.createLinearGradient(0, 0, size, size);
agradient.addColorStop(0, '#22c55e');
agradient.addColorStop(1, '#16a34a');
actx.fillStyle = agradient;
actx.fillRect(0, 0, size, size);

actx.fillStyle = 'white';
actx.beginPath();
actx.arc(512, 520, 280, 0, Math.PI * 2);
actx.fill();

actx.fillStyle = '#16a34a';
actx.beginPath();
actx.arc(750, 350, 140, 0, Math.PI * 2);
actx.fill();

actx.fillStyle = '#22c55e';
actx.beginPath();
actx.moveTo(512, 180);
actx.quadraticCurveTo(620, 220, 650, 320);
actx.quadraticCurveTo(600, 280, 512, 280);
actx.quadraticCurveTo(424, 280, 374, 320);
actx.quadraticCurveTo(404, 220, 512, 180);
actx.fill();

actx.strokeStyle = 'white';
actx.lineWidth = 8;
actx.beginPath();
actx.moveTo(512, 200);
actx.lineTo(512, 270);
actx.stroke();

actx.lineWidth = 4;
actx.beginPath();
actx.moveTo(512, 225);
actx.lineTo(480, 250);
actx.moveTo(512, 225);
actx.lineTo(544, 250);
actx.moveTo(512, 245);
actx.lineTo(490, 265);
actx.moveTo(512, 245);
actx.lineTo(534, 265);
actx.stroke();

actx.fillStyle = '#16a34a';
actx.font = 'bold 180px Arial';
actx.textAlign = 'center';
actx.textBaseline = 'middle';
actx.fillText('FB', 512, 550);

const adaptiveBuffer = adaptiveCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/adaptive-icon.png', adaptiveBuffer);
console.log('✓ Adaptive icon created!');

// Splash icon
const splashCanvas = createCanvas(size, size);
const sctx = splashCanvas.getContext('2d');

sctx.clearRect(0, 0, size, size);

sctx.fillStyle = '#16a34a';
sctx.beginPath();
sctx.arc(512, 520, 320, 0, Math.PI * 2);
sctx.fill();

sctx.fillStyle = 'white';
sctx.beginPath();
sctx.arc(512, 520, 280, 0, Math.PI * 2);
sctx.fill();

sctx.fillStyle = '#f0fdf4';
sctx.beginPath();
sctx.arc(780, 320, 160, 0, Math.PI * 2);
sctx.fill();

sctx.fillStyle = '#22c55e';
sctx.beginPath();
sctx.moveTo(512, 140);
sctx.quadraticCurveTo(640, 190, 680, 310);
sctx.quadraticCurveTo(620, 260, 512, 260);
sctx.quadraticCurveTo(404, 260, 344, 310);
sctx.quadraticCurveTo(384, 190, 512, 140);
sctx.fill();

sctx.strokeStyle = 'white';
sctx.lineWidth = 10;
sctx.beginPath();
sctx.moveTo(512, 165);
sctx.lineTo(512, 250);
sctx.stroke();

sctx.lineWidth = 5;
sctx.beginPath();
sctx.moveTo(512, 195);
sctx.lineTo(475, 225);
sctx.moveTo(512, 195);
sctx.lineTo(549, 225);
sctx.stroke();

sctx.fillStyle = '#16a34a';
sctx.font = 'bold 200px Arial';
sctx.textAlign = 'center';
sctx.textBaseline = 'middle';
sctx.fillText('FB', 512, 560);

const splashBuffer = splashCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/splash-icon.png', splashBuffer);
console.log('✓ Splash icon created!');

// Favicon (196x196)
const faviconCanvas = createCanvas(196, 196);
const fctx = faviconCanvas.getContext('2d');

const fgradient = fctx.createLinearGradient(0, 0, 196, 196);
fgradient.addColorStop(0, '#22c55e');
fgradient.addColorStop(1, '#16a34a');
fctx.fillStyle = fgradient;

const fr = 40;
fctx.beginPath();
fctx.moveTo(fr, 0);
fctx.lineTo(196 - fr, 0);
fctx.quadraticCurveTo(196, 0, 196, fr);
fctx.lineTo(196, 196 - fr);
fctx.quadraticCurveTo(196, 196, 196 - fr, 196);
fctx.lineTo(fr, 196);
fctx.quadraticCurveTo(0, 196, 0, 196 - fr);
fctx.lineTo(0, fr);
fctx.quadraticCurveTo(0, 0, fr, 0);
fctx.closePath();
fctx.fill();

fctx.fillStyle = 'white';
fctx.font = 'bold 80px Arial';
fctx.textAlign = 'center';
fctx.textBaseline = 'middle';
fctx.fillText('FB', 98, 105);

const faviconBuffer = faviconCanvas.toBuffer('image/png');
fs.writeFileSync('./assets/favicon.png', faviconBuffer);
console.log('✓ Favicon created!');

console.log('\n🎉 All icons generated successfully!');
