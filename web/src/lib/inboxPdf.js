import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const STATUS_ZH = {
  new: "新咨询",
  quoted: "已发报价",
  deposit_paid: "已付定金",
  done: "已完工",
};

const MAX_PHOTOS = 6;
/** Old layout had 6 skinny slots; each large photo now uses ~3 of those → 2 per band. */
const PHOTOS_PER_BAND = 2;
const FIELD_COLS = 10;

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

/** Prefer full-res for readable PDF; fall back to thumb. */
async function resolvePhotoSrc(lead, photo, getPhoto) {
  if (getPhoto && photo?.id) {
    try {
      const full = await getPhoto(lead.id, photo.id);
      if (full?.dataUrl) return full.dataUrl;
    } catch {
      /* use thumb */
    }
  }
  return photo?.thumb || photo?.dataUrl || "";
}

async function photoCellHtml(lead, photo, index, getPhoto) {
  if (!photo) return '<td class="photo-cell empty">—</td>';
  const src = await resolvePhotoSrc(lead, photo, getPhoto);
  const label = esc(photo.name || `图${index + 1}`);
  if (!src) return `<td class="photo-cell empty">${label}</td>`;
  return `<td class="photo-cell"><div class="photo-wrap"><img src="${src}" alt="${label}" /><span>${index + 1}</span></div></td>`;
}

function fieldCellsHtml(lead, index) {
  return `
    <td class="c-num">${index + 1}</td>
    <td class="c-text">${esc(lead.name)}</td>
    <td class="c-text">${esc(lead.phone)}</td>
    <td class="c-text">${esc(lead.email)}</td>
    <td class="c-text">${esc(lead.address)}</td>
    <td class="c-text">${esc(lead.quotation)}</td>
    <td class="c-text">${esc(STATUS_ZH[lead.status] || lead.status)}</td>
    <td class="c-text">${esc(lead.source)}</td>
    <td class="c-notes">${esc(lead.notes)}</td>
    <td class="c-text">${esc(formatWhen(lead.created_at))}</td>
  `;
}

async function buildRowsHtml(leads, getPhoto) {
  const rows = [];
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const photos = [...(lead.photos || [])].slice(0, MAX_PHOTOS);
    const bandCount = Math.max(1, Math.ceil(photos.length / PHOTOS_PER_BAND));

    for (let band = 0; band < bandCount; band++) {
      const photoCells = [];
      for (let slot = 0; slot < PHOTOS_PER_BAND; slot++) {
        const pi = band * PHOTOS_PER_BAND + slot;
        photoCells.push(await photoCellHtml(lead, photos[pi], pi, getPhoto));
      }

      if (band === 0) {
        rows.push(`
          <tr class="lead-row">
            ${fieldCellsHtml(lead, i).replace(
              /<td /g,
              bandCount > 1 ? `<td rowspan="${bandCount}" ` : "<td "
            )}
            ${photoCells.join("")}
          </tr>
        `);
      } else {
        rows.push(`
          <tr class="lead-row photo-cont">
            ${photoCells.join("")}
          </tr>
        `);
      }
    }
  }
  return rows.join("");
}

/**
 * Landscape PDF backup: field columns stay one-per-column;
 * photos are ~3× larger (former 图1–图3 width → 图1, 图4–图6 → 图2, then next band).
 */
export async function exportInboxPdf(leads, {
  filename,
  getPhoto,
  title = "NOVA 来客跟进备份",
} = {}) {
  const list = Array.isArray(leads) ? leads : [];
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const outName = filename || `nova-inbox-${stamp}.pdf`;

  const wrap = document.createElement("div");
  wrap.setAttribute("data-inbox-pdf", "1");
  // Wider canvas so large photo cells are not crushed when scaled to A4.
  wrap.style.cssText = "position:fixed;left:-10000px;top:0;width:1700px;background:#fff;z-index:-1;";
  wrap.innerHTML = `
    <div class="inbox-pdf-root">
      <style>
        .inbox-pdf-root {
          font-family: "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif;
          color: #111;
          padding: 16px 18px 24px;
          background: #fff;
        }
        .inbox-pdf-root h1 {
          margin: 0 0 4px;
          font-size: 18px;
          font-weight: 700;
        }
        .inbox-pdf-root .meta {
          margin: 0 0 12px;
          font-size: 11px;
          color: #555;
        }
        .inbox-pdf-root table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          font-size: 10px;
        }
        .inbox-pdf-root th,
        .inbox-pdf-root td {
          border: 1px solid #222;
          padding: 5px 4px;
          vertical-align: top;
          word-break: break-word;
        }
        .inbox-pdf-root th {
          background: #eef6ef;
          font-weight: 700;
          text-align: center;
        }
        .inbox-pdf-root .c-num { width: 28px; text-align: center; font-weight: 700; }
        .inbox-pdf-root .c-notes { font-size: 9px; }
        .inbox-pdf-root .photo-cell {
          width: 210px;
          text-align: center;
          vertical-align: middle;
          padding: 6px;
          background: #fafafa;
        }
        .inbox-pdf-root .photo-wrap {
          display: inline-block;
          position: relative;
        }
        .inbox-pdf-root .photo-cell img {
          width: 196px;
          height: 196px;
          object-fit: cover;
          display: block;
          margin: 0 auto;
          border: 1px solid #888;
          background: #fff;
        }
        .inbox-pdf-root .photo-wrap span {
          position: absolute;
          left: 4px;
          top: 4px;
          background: rgba(0,0,0,0.65);
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 3px;
        }
        .inbox-pdf-root .photo-cell.empty {
          color: #999;
          height: 196px;
          vertical-align: middle;
        }
        .inbox-pdf-root tr.photo-cont td { background: #fafafa; }
      </style>
      <h1>${esc(title)}</h1>
      <p class="meta">
        导出时间 ${esc(stamp)} · 共 ${list.length} 条来客 ·
        字段一列一列；照片放大（原图1–图3宽度给图1，图4–图6给图2，更多照片向下续行）· 优先嵌入原图
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
            <th>图（大）A</th>
            <th>图（大）B</th>
          </tr>
        </thead>
        <tbody>
          ${list.length
            ? await buildRowsHtml(list, getPhoto)
            : `<tr><td colspan="${FIELD_COLS + PHOTOS_PER_BAND}">暂无数据</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  document.body.appendChild(wrap);

  try {
    const imgs = [...wrap.querySelectorAll("img")];
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

    const node = wrap.querySelector(".inbox-pdf-root");
    const canvas = await html2canvas(node, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 6;
    const usableW = pageW - margin * 2;
    const usableH = pageH - margin * 2;

    const imgW = usableW;
    const imgH = (canvas.height * imgW) / canvas.width;
    const pageCanvasH = Math.floor((usableH / imgH) * canvas.height);

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
      if (page > 60) break;
    }

    pdf.save(outName);
    return { ok: true, filename: outName, rows: list.length, pages: page };
  } finally {
    wrap.remove();
  }
}
