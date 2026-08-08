import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const STATUS_ZH = {
  new: "新咨询",
  quoted: "已发报价",
  deposit_paid: "已付定金",
  done: "已完工",
};

const MAX_PHOTOS = 6;

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
  if (photo?.thumb) return photo.thumb;
  if (photo?.dataUrl) return photo.dataUrl;
  if (!getPhoto || !photo?.id) return "";
  try {
    const full = await getPhoto(lead.id, photo.id);
    return full?.dataUrl || "";
  } catch {
    return "";
  }
}

async function buildRowsHtml(leads, getPhoto) {
  const rows = [];
  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    const photos = lead.photos || [];
    const cells = [];
    for (let p = 0; p < MAX_PHOTOS; p++) {
      const photo = photos[p];
      if (!photo) {
        cells.push('<td class="photo-cell empty">—</td>');
        continue;
      }
      const src = await resolvePhotoSrc(lead, photo, getPhoto);
      cells.push(
        src
          ? `<td class="photo-cell"><img src="${src}" alt="${esc(photo.name || `图${p + 1}`)}" /></td>`
          : `<td class="photo-cell empty">${esc(photo.name || "图")}</td>`
      );
    }
    rows.push(`
      <tr>
        <td class="c-num">${i + 1}</td>
        <td class="c-text">${esc(lead.name)}</td>
        <td class="c-text">${esc(lead.phone)}</td>
        <td class="c-text">${esc(lead.email)}</td>
        <td class="c-text">${esc(lead.address)}</td>
        <td class="c-text">${esc(lead.quotation)}</td>
        <td class="c-text">${esc(STATUS_ZH[lead.status] || lead.status)}</td>
        <td class="c-text">${esc(lead.source)}</td>
        <td class="c-notes">${esc(lead.notes)}</td>
        <td class="c-text">${esc(formatWhen(lead.created_at))}</td>
        ${cells.join("")}
      </tr>
    `);
  }
  return rows.join("");
}

function photoHeaders() {
  return Array.from({ length: MAX_PHOTOS }, (_, i) => `<th>图${i + 1}</th>`).join("");
}

/**
 * Export lead inbox as a landscape PDF: one lead per row, one field per column, photos in 图1–图6.
 * Renders HTML → canvas so Chinese text stays readable without embedding a CJK font file.
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
  wrap.style.cssText = "position:fixed;left:-10000px;top:0;width:1400px;background:#fff;z-index:-1;";
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
          width: 72px;
          text-align: center;
          vertical-align: middle;
          padding: 3px;
        }
        .inbox-pdf-root .photo-cell img {
          width: 64px;
          height: 64px;
          object-fit: cover;
          display: block;
          margin: 0 auto;
          border: 1px solid #bbb;
        }
        .inbox-pdf-root .photo-cell.empty { color: #999; }
      </style>
      <h1>${esc(title)}</h1>
      <p class="meta">导出时间 ${esc(stamp)} · 共 ${list.length} 行 · 一列一个字段，一行一条来客</p>
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
            ${photoHeaders()}
          </tr>
        </thead>
        <tbody>
          ${list.length ? await buildRowsHtml(list, getPhoto) : `<tr><td colspan="${10 + MAX_PHOTOS}">暂无数据</td></tr>`}
        </tbody>
      </table>
    </div>
  `;
  document.body.appendChild(wrap);

  try {
    // Wait for images to decode before rasterizing
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
    const margin = 8;
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
      pdf.addImage(slice.toDataURL("image/jpeg", 0.92), "JPEG", margin, margin, imgW, sliceHmm);
      offsetY += sliceH;
      page += 1;
      if (page > 40) break; // safety
    }

    pdf.save(outName);
    return { ok: true, filename: outName, rows: list.length, pages: page };
  } finally {
    wrap.remove();
  }
}
