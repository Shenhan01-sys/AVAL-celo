// Shared invoice helpers — used by the deal page and the file-preview modal.

export function lineItems(amount: number, isPO: boolean): [string, string, number][] {
  const a = Math.round((amount * 0.55) / 1000) * 1000;
  const b = Math.round((amount * 0.3) / 1000) * 1000;
  const c = Math.max(0, amount - a - b);
  return isPO
    ? [["Raw materials — bulk batch", "units", a], ["Tooling, setup & QA", "lot", b], ["Freight & handling", "service", c]]
    : [["Goods supplied per contract", "delivery", a], ["Installation & commissioning", "service", b], ["Support & warranty (12 mo)", "service", c]];
}

export const dateMinus = (due: string, days: number) => {
  try {
    const d = new Date(due);
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
};

// Deterministic faux-sensitive fields — these are what we REDACT on the public preview
// (bank details, contacts, signature) and only reveal to funders.
export function sensitive(fin: any) {
  const digits = String(fin?.invoice_number || "0").replace(/\D/g, "").padStart(6, "0");
  const slug = (String(fin?.issuer_name || "supplier").toLowerCase().replace(/[^a-z]/g, "").slice(0, 14)) || "supplier";
  return {
    bankName: (String(fin?.issuer_name || "Niaga").split(" ").slice(-1)[0] || "Niaga") + " Bank",
    account: "ID" + digits.slice(0, 2) + " 88" + digits.slice(0, 2) + " " + digits.slice(2, 6) + " " + digits.slice(-4),
    email: "ar@" + slug + ".co.id",
    phone: "+62 " + digits.slice(0, 3) + "-" + digits.slice(2, 5) + "-" + digits.slice(-4),
    signatory: "Finance Director",
  };
}
