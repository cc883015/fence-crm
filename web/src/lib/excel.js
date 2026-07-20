import * as XLSX from "xlsx";

const HEADERS = [
  "ID", "Name", "Phone", "Email", "Suburb", "Source", "Stage",
  "Service Area", "Fence Length", "Gate", "Gate Width", "Install Type",
  "Style", "Color", "Slope", "Dual Estimate", "Deposit Informed",
  "Has Deposit", "Has Full", "Notes", "Created",
];

function rowFromCustomer(c) {
  return [
    c.id, c.name, c.phone, c.email, c.suburb, c.source, c.stage,
    c.service_area, c.fence_length,
    c.gate_required ? "Yes" : "No", c.gate_width, c.install_type,
    c.fence_style, c.color, c.slope, c.dual_estimate ? "Yes" : "No",
    c.deposit_informed ? "Yes" : "No",
    c.has_deposit ? "Yes" : "No", c.has_full ? "Yes" : "No",
    c.notes || "", c.created_at || "",
  ];
}

export function exportCustomersExcel(customers, filename = "nova-customers.xlsx") {
  const data = [HEADERS, ...customers.map(rowFromCustomer)];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Customers");
  XLSX.writeFile(wb, filename);
}

export function exportOneCustomerExcel(customer) {
  const name = (customer.name || "customer").replace(/\s+/g, "_");
  exportCustomersExcel([customer], `nova-${name}-${customer.id}.xlsx`);
}
