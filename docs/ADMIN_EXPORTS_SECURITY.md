# FLOXA Work — Secure Administrative CSV Export Engine

**Module:** Platform Data Extraction & Compliance Reporting  
**Route:** `GET /api/admin/exports/:type`  
**Security Standard:** CSV Formula Injection Defense (CWE-1236)  
**Permission Required:** `exports:generate` (`super_admin`, `operations_admin`)  
**Date:** 14 November 2026  

---

## 1. Security Threat: CSV / Spreadsheet Formula Injection (CWE-1236)

When exporting platform user data, project briefs, or contracts into CSV files, malicious actors can register with crafted inputs starting with spreadsheet formula triggers:
```text
=cmd|' /C calc'!A0
+2+5
-1+1
@SUM(1+1)
```
If an administrator downloads this CSV and opens it in spreadsheet software (Microsoft Excel, LibreOffice Calc, Google Sheets), the application may execute arbitrary system commands via Dynamic Data Exchange (DDE) or perform data exfiltration.

---

## 2. Server-Side Formula Sanitization Implementation

FLOXA Work implements defense-in-depth sanitization on every single exported CSV cell:

```typescript
function sanitizeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  
  // CSV Injection defense: if cell starts with dangerous formula symbols, quote prefix it
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  
  // Escape internal double quotes
  str = str.replace(/"/g, '""');
  return `"${str}"`;
}
```

### Defense Mechanics
1. **Formula Neutralization:** Any string starting with `=`, `+`, `-`, `@`, `\t`, or `\r` is prepended with a single quote (`'`). When opened in Excel or Calc, the spreadsheet treats the cell purely as literal text rather than an executable formula.
2. **Double-Quote Escaping:** Internal quotation marks are escaped (`""`) to prevent delimiter breakage.
3. **Double-Quote Enclosure:** Every field is wrapped in standard CSV double quotes.

---

## 3. Mandatory Non-Custodial Disclosures in Export Headers

In accordance with FLOXA Work's non-custodial direct billing business model, all contracts and payment record exports embed explicit non-custodial notices directly inside the top lines of the generated CSV:

```csv
# USER-REPORTED EXTERNAL PAYMENT RECORDS (DIRECT BILLING - ZERO ESCROW CUSTODY - NOT FLOXA REVENUE)
# FLOXA Work is a discovery-first freelance platform. Payments are settled directly between parties via external bank transfer, UPI, or external invoice. FLOXA Work does not custody user funds.
Record ID,Contract ID,Milestone ID,Reported Amount,Currency,Payment Method,External UTR / Reference,Settlement Status,Created At
```

---

## 4. Export Types & Access Governance

| Export Identifier | Included Fields | Authorization |
| :--- | :--- | :--- |
| `users` | Safe user identity, handles, emails, roles, account status, creation dates. Credentials omitted. | `exports:generate` |
| `contracts` | Contract IDs, participant names, agreed total budget, currency, status, closeout status, non-custodial header. | `exports:generate` |
| `external-payment-records` | Payment IDs, contract IDs, milestone IDs, reported amounts, payment methods, UTR references, settlement status, mandatory non-custodial header. | `exports:generate` |
| `moderation` | Dispute IDs, contract IDs, categories, titles, resolution statuses, creation dates. | `exports:generate` |

All export actions are automatically logged in the immutable audit trail with operator identity and export type.
