import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const STATUS_ZH = {
  new: "新咨询",
  quoted: "已发报价",
  deposit_paid: "已付定金",
  done: "已完工",
};

const MAX_PHOTOS = 6;
/** Square frame (px). Images scale proportionally inside (contain) so nothing is cropped. */
const PHOTO_SIZE = 300;

function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatWhen(iso) {
  if (!iso) return "";
  return String(iso).replace("T", " ").slice(0, 16);
}

async function resolvePhotoSrc(lead, photo, getPhoto) {
  if (getPhoto && photo?.id) {
    try {
      const full = await getPhoto(lead.id, photo.id);
      if (full?.dataUrl) return full.dataUrl;
    } catch {
      /* thumb fallback */
    }
  }
  return photo?.thumb || photo?.dataUrl || "";
}

async function photosColumnHtml(lead, getPhoto) {
  const photos = [...(lead.photos || [])].slice(0, MAX_PHOTOS);
  if (!photos.length) {
    return '<td class="photo-col empty">无照片</td>';
  }
  const blocks = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const src = await resolvePhotoSrc(lead, photo, getPhoto);
    const label = esc(photo.name || `图${i + 1}`);
    if (!src) {
      blocks.push(`<div class="photo-sq empty">${label}</div>`);
      continue;
    }
    blocks.push(`
      <div class="photo-sq">
        <img src="${src}" alt="${label}" />
        <span class="photo-idx">${i + 1}</span>
      </div>
    `);
  }
  return `<td class="photo-col"><div class="photo-stack">${blocks.join("")}</div></td>`;
}

function statusCellHtml(status) {
  const label = STATUS_ZH[status] || status || "";
  const paid = status === "deposit_paid";
  return `<td class="c-text c-status${paid ? " status-deposit-paid" : ""}">${esc(label)}</td>`;
}

async function buildRowsHtml(leads, getPhoto) {
  const rows = [];
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    rows.push(`
      <tr class="${lead.status === "deposit_paid" ? "row-deposit-paid" : ""}">
        <td class="c-num">${i + 1}</td>
        <td class="c-text">${esc(lead.name)}</td>
        <td class="c-text">${esc(lead.phone)}</td>
        <td class="c-text">${esc(lead.email)}</td>
        <td class="c-text">${esc(lead.address)}</td>
        <td class="c-text">${esc(lead.quotation)}</td>
        ${statusCellHtml(lead.status)}
        <td class="c-text">${esc(lead.source)}</td>
        <td class="c-notes">${esc(lead.notes)}</td>
        <td class="c-text">${esc(formatWhen(lead.created_at))}</td>
        ${await photosColumnHtml(lead, getPhoto)}
      </tr>
    `);
  }
  return rows.join("");
}

function tableStyles() {
  return `
    .inbox-pdf-root {
      font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
      color: #111;
      padding: 18px 20px 28px;
      background: #fff;
      box-sizing: border-box;
    }
    .inbox-pdf-root h1 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 700;
    }
    .inbox-pdf-root .meta {
      margin: 0 0 14px;
      font-size: 13px;
      color: #444;
    }
    .inbox-pdf-root table {
      border-collapse: collapse;
      font-size: 15px;
      min-width: 1400px;
    }
    .inbox-pdf-root th,
    .inbox-pdf-root td {
      border: 1px solid #222;
      padding: 10px 12px;
      vertical-align: top;
      word-break: break-word;
    }
    .inbox-pdf-root th {
      background: #eef6ef;
      font-weight: 700;
      font-size: 15px;
      text-align: center;
      white-space: nowrap;
    }
    .inbox-pdf-root .c-num {
      width: 40px;
      text-align: center;
      font-weight: 700;
      font-size: 16px;
    }
    .inbox-pdf-root .c-text {
      font-size: 15px;
      line-height: 1.45;
      min-width: 100px;
    }
    .inbox-pdf-root .c-notes {
      font-size: 14px;
      line-height: 1.45;
      min-width: 160px;
      max-width: 260px;
    }
    .inbox-pdf-root .c-status.status-deposit-paid {
      color: #0f7a45;
      font-weight: 800;
    }
    .inbox-pdf-root tr.row-deposit-paid .c-status.status-deposit-paid {
      color: #0f7a45;
    }
    .inbox-pdf-root .photo-col {
      min-width: ${PHOTO_SIZE + 28}px;
      width: ${PHOTO_SIZE + 28}px;
      background: #f7f7f7;
      vertical-align: top;
    }
    .inbox-pdf-root .photo-col.empty {
      color: #888;
      text-align: center;
      vertical-align: middle;
      font-size: 14px;
    }
    .inbox-pdf-root .photo-stack {
      display: flex;
      flex-direction: column;
      gap: 10px;
      align-items: center;
    }
    .inbox-pdf-root .photo-sq {
      position: relative;
      width: ${PHOTO_SIZE}px;
      height: ${PHOTO_SIZE}px;
      flex: 0 0 ${PHOTO_SIZE}px;
      background: #ececec;
      border: 1px solid #777;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    /* Keep aspect ratio; fit entire image inside the square (no crop). */
    .inbox-pdf-root .photo-sq img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      display: block;
    }
    .inbox-pdf-root .photo-sq.empty {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999;
      font-size: 13px;
    }
    .inbox-pdf-root .photo-idx {
      position: absolute;
      left: 6px;
      top: 6px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      font-size: 13px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 4px;
    }
  `;
}

/**
 * Build the backup table DOM (text columns + one stacked square photo column).
 * Caller may mount it in a horizontally scrollable preview.
 */
export async function buildInboxExportTable(leads, {
  getPhoto,
  title = "NOVA 来客跟进备份",
} = {}) {
  const list = Array.isArray(leads) ? leads : [];
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const root = document.createElement("div");
  root.className = "inbox-pdf-root";
  root.innerHTML = `
    <style>${tableStyles()}</style>
    <h1>${esc(title)}</h1>
    <p class="meta">
      导出时间 ${esc(stamp)} · 共 ${list.length} 条 ·
      文字加大；照片等比例放入右侧正方形（完整可见、不裁切）·
      「已付定金」绿色加粗 · 预览可横向滚动看图
    </p>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>姓名</th>
          <th>电话</th>
          <th>邮箱</th>
          <th>地址</th>
          <th>报价号</th>
          <th>状态</th>
          <th>来源</th>
          <th>备注</th>
          <th>录入</th>
          <th>照片</th>
        </tr>
      </thead>
      <tbody>
        ${list.length
          ? await buildRowsHtml(list, getPhoto)
          : `<tr><td colspan="11">暂无数据</td></tr>`}
      </tbody>
    </table>
  `;
  return { root, stamp, count: list.length };
}

/** Wire vertical wheel to horizontal scroll (Shift not required). */
export function bindHorizontalWheel(scroller) {
  if (!scroller) return () => {};
  const onWheel = (e) => {
    if (e.deltaY === 0) return;
    // Prefer horizontal pan when the table is wider than the viewport.
    if (scroller.scrollWidth <= scroller.clientWidth + 2) return;
    scroller.scrollLeft += e.deltaY;
    e.preventDefault();
  };
  scroller.addEventListener("wheel", onWheel, { passive: false });
  return () => scroller.removeEventListener("wheel", onWheel);
}

export async function renderInboxTableToPdf(root, {
  filename,
  stamp,
} = {}) {
  const outName = filename || `nova-inbox-${stamp || "export"}.pdf`;

  const imgs = [...root.querySelectorAll("img")];
  await Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            })
    )
  );

  const canvas = await html2canvas(root, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: root.scrollWidth,
    width: root.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 6;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2;

  const imgW = usableW;
  const imgH = (canvas.height * imgW) / canvas.width;
  const pageCanvasH = Math.max(1, Math.floor((usableH / imgH) * canvas.height));

  let offsetY = 0;
  let page = 0;
  while (offsetY < canvas.height) {
    if (page > 0) pdf.addPage();
    const sliceH = Math.min(pageCanvasH, canvas.height - offsetY);
    const slice = document.createElement("canvas");
    slice.width = canvas.width;
    slice.height = sliceH;
    const ctx = slice.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, slice.width, slice.height);
    ctx.drawImage(canvas, 0, offsetY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);
    const sliceHmm = (sliceH * imgW) / canvas.width;
    pdf.addImage(slice.toDataURL("image/jpeg", 0.93), "JPEG", margin, margin, imgW, sliceHmm);
    offsetY += sliceH;
    page += 1;
    if (page > 80) break;
  }

  pdf.save(outName);
  return { ok: true, filename: outName, pages: page };
}

/** One-shot: build table off-screen and save PDF (no preview). */
export async function exportInboxPdf(leads, opts = {}) {
  const { root, stamp, count } = await buildInboxExportTable(leads, opts);
  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;background:#fff;z-index:-1;";
  host.appendChild(root);
  document.body.appendChild(host);
  try {
    const result = await renderInboxTableToPdf(root, { filename: opts.filename, stamp });
    return { ...result, rows: count };
  } finally {
    host.remove();
  }
}
