import { Asset } from '../types/itm';

export function buildQRLabelsHtml(
  assets: Asset[], 
  companyName: string, 
  qrMap: Record<string, string>,
  layout: 'standard' | 'zebra' | 'compact' = 'standard',
  autoPrint = false
): string {
  const isZebra = layout === 'zebra';
  const isCompact = layout === 'compact';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>ITM Asset QR Labels - ${escapeHtml(companyName)}</title>
  <style>
    @page {
      size: ${isZebra ? '4in 2.5in' : 'auto'};
      margin: ${isZebra ? '0.1in' : '8mm'};
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      margin: 0;
      padding: ${isZebra ? '4px' : '12px'};
      background: #ffffff;
      color: #0f172a;
    }
    .grid {
      display: grid;
      grid-template-columns: ${isZebra ? '1fr' : isCompact ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)'};
      gap: ${isZebra ? '0' : '14px'};
    }
    .label-card {
      border: 2px solid #000000;
      border-radius: 6px;
      padding: ${isCompact ? '8px' : '12px'};
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      page-break-inside: avoid;
      break-inside: avoid;
      margin-bottom: ${isZebra ? '10px' : '0'};
      min-height: ${isZebra ? '2.3in' : isCompact ? '135px' : '190px'};
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #000000;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .header-title {
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #000000;
    }
    .badge {
      font-size: 9px;
      font-family: monospace;
      font-weight: bold;
      background: #f1f5f9;
      border: 1px solid #000000;
      padding: 1px 6px;
      border-radius: 3px;
      color: #000000;
    }
    .body {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .qr-img {
      width: ${isCompact ? '64px' : '96px'};
      height: ${isCompact ? '64px' : '96px'};
      object-fit: contain;
      border: 1px solid #cbd5e1;
      border-radius: 4px;
      padding: 2px;
      background: #ffffff;
      flex-shrink: 0;
    }
    .details {
      flex: 1;
      min-width: 0;
    }
    .code {
      font-family: monospace;
      font-size: 13px;
      font-weight: 900;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
      color: #000000;
    }
    .name {
      font-size: 11px;
      font-weight: 700;
      line-height: 1.25;
      margin-bottom: 3px;
      color: #0f172a;
    }
    .meta {
      font-size: 9px;
      color: #334155;
      line-height: 1.35;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      margin-top: 6px;
      padding-top: 4px;
      display: flex;
      justify-content: space-between;
      font-size: 8px;
      font-family: monospace;
      color: #475569;
    }
    .bold-tag {
      font-weight: bold;
      color: #000000;
    }
  </style>
</head>
<body>
  <div class="grid">
    ${assets.map(a => `
      <div class="label-card">
        <div class="header">
          <div class="header-title">${escapeHtml(companyName.split(' ')[0])} IT ASSET</div>
          <div class="badge">${escapeHtml(a.category)}</div>
        </div>
        <div class="body">
          <img class="qr-img" src="${qrMap[a.id] || ''}" alt="${escapeHtml(a.assetCode)}">
          <div class="details">
            <div class="code">${escapeHtml(a.assetCode)}</div>
            <div class="name">${escapeHtml(a.employeeOrDeviceName)}</div>
            <div class="meta"><strong>Dept:</strong> ${escapeHtml(a.department)}</div>
            <div class="meta"><strong>SN:</strong> ${escapeHtml(a.specificationOrSN)}</div>
          </div>
        </div>
        <div class="footer">
          <span>PUR: ${escapeHtml(a.purchaseDate)}</span>
          <span class="bold-tag">DO NOT REMOVE TAG - PROPERTY OF ${escapeHtml(companyName.toUpperCase())}</span>
        </div>
      </div>
    `).join('')}
  </div>
  ${autoPrint ? `
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        try {
          window.focus();
          window.print();
        } catch (e) {
          console.warn('Auto print error:', e);
        }
      }, 350);
    });
  </script>` : ''}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Universal print trigger that reliably prints QR labels without locking
 * or freezing the host application event loop.
 */
export function executePrint(htmlContent: string) {
  // Try clean hidden iframe printing
  try {
    const existing = document.getElementById('itm-silent-print-frame');
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'itm-silent-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn('Iframe print intercepted:', e);
          // Auto fallback to printable file download
          downloadPrintableHtml(htmlContent, `ITM_QR_Labels_${Date.now()}.html`);
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              iframe.remove();
            }
          }, 3500);
        }
      }, 350);
      return;
    }
  } catch (err) {
    console.warn('Silent print initialization failed, downloading printable HTML instead:', err);
  }

  // Fallback: download standalone printable HTML
  downloadPrintableHtml(htmlContent, `ITM_QR_Labels_${Date.now()}.html`);
}

/**
 * Downloads a standalone printable HTML file with embedded base64 QR codes
 * and an auto-run print trigger when opened in any desktop or mobile browser.
 */
export function downloadPrintableHtml(htmlContent: string, filename: string) {
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Render a high-resolution 300-DPI composite asset label onto an HTML5 Canvas.
 * Ready for saving as PNG or pasting into documents/label editors.
 */
export function renderAssetTagToCanvas(
  asset: Asset,
  companyName: string,
  qrDataUrl: string,
  layout: 'standard' | 'zebra' | 'compact' = 'standard'
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const isZebra = layout === 'zebra';
    const isCompact = layout === 'compact';

    // Canvas dimensions (high resolution for 300 DPI thermal/laser printing)
    const width = isZebra ? 1200 : isCompact ? 750 : 900;
    const height = isZebra ? 750 : isCompact ? 420 : 540;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Outer heavy border
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Inner subtle margin
    const pad = 36;

    // Header division
    const headerHeight = 64;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${companyName.split(' ')[0].toUpperCase()} IT ASSET TAG`, pad, pad + 32);

    // Category badge
    const badgeText = asset.category.toUpperCase();
    ctx.font = 'bold 20px monospace';
    const badgeWidth = ctx.measureText(badgeText).width + 24;
    const badgeX = width - pad - badgeWidth;
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(badgeX, pad + 4, badgeWidth, 34);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.strokeRect(badgeX, pad + 4, badgeWidth, 34);
    ctx.fillStyle = '#0f172a';
    ctx.fillText(badgeText, badgeX + 12, pad + 28);

    // Horizontal divider
    ctx.beginPath();
    ctx.moveTo(pad, pad + headerHeight);
    ctx.lineTo(width - pad, pad + headerHeight);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Load QR Image
    const qrImg = new Image();
    qrImg.crossOrigin = 'anonymous';
    qrImg.onload = () => {
      // Draw QR Image
      const qrSize = height - headerHeight - 140;
      const qrX = pad;
      const qrY = pad + headerHeight + 20;

      // QR border
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX, qrY, qrSize, qrSize);
      ctx.drawImage(qrImg, qrX + 4, qrY + 4, qrSize - 8, qrSize - 8);

      // Text column
      const textX = qrX + qrSize + 28;
      let textY = qrY + 36;

      // Asset Code
      ctx.fillStyle = '#000000';
      ctx.font = '900 40px monospace';
      ctx.fillText(asset.assetCode, textX, textY);

      // Device / Employee Name
      textY += 46;
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      
      // Truncate name if too long
      const maxTextWidth = width - textX - pad;
      let nameStr = asset.employeeOrDeviceName;
      while (ctx.measureText(nameStr).width > maxTextWidth && nameStr.length > 5) {
        nameStr = nameStr.substring(0, nameStr.length - 4) + '...';
      }
      ctx.fillText(nameStr, textX, textY);

      // Department
      textY += 38;
      ctx.fillStyle = '#334155';
      ctx.font = '24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`Department: ${asset.department}`, textX, textY);

      // S/N Specification
      textY += 34;
      ctx.fillStyle = '#475569';
      ctx.font = '22px monospace';
      let snStr = `SN: ${asset.specificationOrSN}`;
      while (ctx.measureText(snStr).width > maxTextWidth && snStr.length > 8) {
        snStr = snStr.substring(0, snStr.length - 4) + '...';
      }
      ctx.fillText(snStr, textX, textY);

      // Purchase Date
      textY += 32;
      ctx.font = '20px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`Purchased: ${asset.purchaseDate} | Status: ${asset.status}`, textX, textY);

      // Footer
      const footerY = height - 26;
      ctx.beginPath();
      ctx.moveTo(pad, height - 52);
      ctx.lineTo(width - pad, height - 52);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 18px monospace';
      ctx.fillText(`PROPERTY OF ${companyName.toUpperCase()} - DO NOT REMOVE OR TAMPER`, pad, footerY);

      resolve(canvas);
    };

    qrImg.onerror = () => {
      reject(new Error('Failed to load QR image on canvas'));
    };

    qrImg.src = qrDataUrl;
  });
}

/**
 * Downloads a single asset label as a crisp 300-DPI PNG image
 */
export async function downloadAssetLabelImage(
  asset: Asset,
  companyName: string,
  qrDataUrl: string,
  layout: 'standard' | 'zebra' | 'compact' = 'standard'
) {
  const canvas = await renderAssetTagToCanvas(asset, companyName, qrDataUrl, layout);
  const dataUrl = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `QR_AssetTag_${asset.assetCode}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Copies the asset tag PNG directly to system clipboard
 */
export async function copyAssetLabelImageToClipboard(
  asset: Asset,
  companyName: string,
  qrDataUrl: string,
  layout: 'standard' | 'zebra' | 'compact' = 'standard'
): Promise<boolean> {
  try {
    const canvas = await renderAssetTagToCanvas(asset, companyName, qrDataUrl, layout);
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } catch (err) {
          console.warn('Clipboard write failed:', err);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (err) {
    console.error('Copy label image error:', err);
    return false;
  }
}
