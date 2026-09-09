import React from "react";
import { money } from "../../lib/quoteMath.js";

export default function QuoteHistory({ rows, onView, onEdit, onDuplicate, onDelete }) {
  return (
    <section className="qq-hist ts-glass">
      <div className="qq-hist-h">
        <div>
          <p className="ts-eyebrow">History</p>
          <h3>历史报价</h3>
        </div>
        <span className="muted">{rows.length} saved</span>
      </div>
      {rows.length === 0 ? (
        <p className="muted">还没有保存的报价。填客户姓名后点 Save Quote。</p>
      ) : (
        <div className="qq-table-wrap">
          <table className="qq-table">
            <thead>
              <tr>
                <th>Quote ID</th>
                <th>Date</th>
                <th>Customer Name</th>
                <th>Fence Type</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.quoteId}>
                  <td className="mono">{r.quoteId}</td>
                  <td>{r.date}</td>
                  <td>{r.customerName}</td>
                  <td>{r.fenceType}</td>
                  <td>{money(r.total)}</td>
                  <td><span className={`qq-st ${r.status}`}>{r.status}</span></td>
                  <td className="qq-acts">
                    <button type="button" className="qq-link" onClick={() => onView(r.quoteId)}>View</button>
                    <button type="button" className="qq-link" onClick={() => onEdit(r.quoteId)}>Edit</button>
                    <button type="button" className="qq-link" onClick={() => onDuplicate(r.quoteId)}>Duplicate</button>
                    <button type="button" className="qq-link danger" onClick={() => onDelete(r.quoteId)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
