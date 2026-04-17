import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Download, Share2, RotateCcw, Plus, Landmark, Camera, QrCode } from 'lucide-react';

interface PaymentRow {
  id: number;
  description: string;
  quantity: string | number;
  rate: string | number;
}

const PaymentTracker: React.FC = () => {
  const initialRows = [{ id: 1, description: 'Structural Design Service', quantity: 1000, rate: 5 }];

  const getSaved = (key: string, def: any) => {
    if (typeof window === 'undefined') return def;
    const s = localStorage.getItem(key);
    if (!s) return def;
    try { return JSON.parse(s); } catch { return s; }
  };

  const [logo, setLogo] = useState<string | null>(() => getSaved('p_logo', null));
  const [qrCode, setQrCode] = useState<string | null>(() => getSaved('p_qr', null));

  const [invoiceLabel, setInvoiceLabel] = useState(() => getSaved('p_label', 'INVOICE'));
  const [advanceLabel, setAdvanceLabel] = useState(() => getSaved('p_adv_lbl', 'ADVANCE PAID'));
  const [snoLabel, setSnoLabel] = useState(() => getSaved('p_sno_lbl', 'S.NO'));
  const [qtyLabel, setQtyLabel] = useState(() => getSaved('p_qty_lbl', 'QTY'));
  const [rateLabel, setRateLabel] = useState(() => getSaved('p_rate_lbl', 'RATE'));
  const [amtLabel, setAmtLabel] = useState(() => getSaved('p_amt_lbl', 'AMOUNT'));

  const [companyName, setCompanyName] = useState(() => getSaved('p_comp', 'UNIQ DESIGNS'));
  const [engineerName, setEngineerName] = useState(() => getSaved('p_eng', 'Structural Engineer : M. Prakash M.E.,'));
  const [address, setAddress] = useState(() => getSaved('p_addr', 'NO: 14/2, 1st Floor, Thambiran street, Trichy - 620005.'));
  const [clientName, setClientName] = useState(() => getSaved('p_client', 'Client Name'));
  const [invoiceNo, setInvoiceNo] = useState(() => getSaved('p_inv_no', 'INV-8156'));
  const [invoiceDate, setInvoiceDate] = useState(() => getSaved('p_date', new Date().toISOString().split('T')[0]));
  const [advanceInput, setAdvanceInput] = useState<string | number>(() => getSaved('p_adv_val', 2000));
  const [rows, setRows] = useState<PaymentRow[]>(() => getSaved('p_rows', initialRows));
  const [bankName, setBankName] = useState(() => getSaved('p_bank', 'INDIAN BANK'));
  const [accName, setAccName] = useState(() => getSaved('p_acc_n', 'PRAKASH M'));
  const [accNo, setAccNo] = useState(() => getSaved('p_acc_no', '6231059572'));

  useEffect(() => {
    const data = {
      p_label: invoiceLabel, p_adv_lbl: advanceLabel, p_sno_lbl: snoLabel, p_qty_lbl: qtyLabel,
      p_rate_lbl: rateLabel, p_amt_lbl: amtLabel, p_comp: companyName, p_eng: engineerName,
      p_addr: address, p_client: clientName, p_inv_no: invoiceNo, p_date: invoiceDate,
      p_adv_val: advanceInput, p_rows: rows, p_bank: bankName, p_acc_n: accName, p_acc_no: accNo
    };
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
    if (logo) localStorage.setItem('p_logo', logo);
    if (qrCode) localStorage.setItem('p_qr', qrCode);
  }, [logo, qrCode, invoiceLabel, advanceLabel, snoLabel, qtyLabel, rateLabel, amtLabel,
    companyName, engineerName, address, clientName, invoiceNo, invoiceDate,
    advanceInput, rows, bankName, accName, accNo]);

  const logoRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (window.confirm('Invoice data reset panna ok-va?')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const f = e.target.files?.[0];
    if (f) {
      const r = new FileReader();
      r.onloadend = () => setter(r.result as string);
      r.readAsDataURL(f);
    }
  };

  const updateRow = useCallback((id: number, field: keyof PaymentRow, value: string) => {
    setRows(prev => prev.map(row =>
      row.id === id
        ? { ...row, [field]: (field === 'quantity' || field === 'rate') ? (value === '' ? '' : parseFloat(value) || '') : value }
        : row
    ));
  }, []);

  const totalAmount = useMemo(() =>
    rows.reduce((s, r) => s + ((Number(r.quantity) || 0) * (Number(r.rate) || 0)), 0),
    [rows]
  );
  const balance = totalAmount - (Number(advanceInput) || 0);

  const onShare = async () => {
    const text = `*Invoice: ${companyName}*\nInvoice No: ${invoiceNo}\nTotal: ₹${totalAmount.toLocaleString()}\nAdvance: ₹${Number(advanceInput).toLocaleString()}\nBalance Due: ₹${balance.toLocaleString()}`;
    if (navigator.share) await navigator.share({ title: 'Invoice', text });
    else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div id="app-root">
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { width: 100%; overflow-x: hidden; font-family: 'Segoe UI', Arial, sans-serif; }

        /* ── SCREEN ── */
        #app-root { background: #e2e8f0; min-height: 100vh; padding-bottom: 32px; }
        .screen-card { width: 100%; max-width: 480px; margin: 0 auto; background: #fff; box-shadow: 0 8px 40px rgba(0,0,0,0.13); }
        @media (min-width: 500px) {
          #app-root { padding: 24px 0 48px; }
          .screen-card { border-radius: 18px; overflow: hidden; }
        }

        .inv-top-band {
          background: #ffffff; /* Idhu dhaan Vellai color coding */
          padding: 18px 18px 14px;
          display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;
        }
        .inv-top-left { flex: 1; min-width: 0; }
        .logo-btn {
          width: 150px; height: 85px; background: rgba(255,255,255,0.08);
          border: 2px dashed rgba(255,255,255,0.25); border-radius: 10px;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          cursor: pointer; margin-bottom: 10px; overflow: hidden;
        }
        .logo-btn img { width: 100%; height: 100%; object-fit: contain; padding: 4px; }
        .co-name { font-size: 20px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.04em; background: transparent; border: none; outline: none; width: 100%; display: block; line-height: 1.15; }
        .co-sub { font-size: 9.5px; font-weight: 600; color: ##64748b; background: transparent; border: none; outline: none; width: 100%; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 2px; }
        .inv-label-input { font-size: 12px; font-weight: 900; color: #2563eb; letter-spacing: 0.18em; text-transform: uppercase; background: transparent; border: none; outline: none; text-align: right; width: 80px; }

        .bill-row { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 2px solid #0f172a; }
        .bill-to-cell { padding: 10px 14px; border-right: 2px solid #0f172a; background: #f8fafc; }
        .bill-details-cell { padding: 10px 14px; }
        .cell-micro { font-size: 8.5px; font-weight: 900; color: #2563eb; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 5px; }
        .client-inp { font-size: 14px; font-weight: 800; color: #0f172a; background: transparent; border: none; outline: none; width: 100%; }
        .det-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .det-lbl { font-size: 8.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
        .det-val { font-size: 10px; font-weight: 900; color: #0f172a; background: transparent; border: none; outline: none; text-align: right; }

        .inv-table { width: 100%; border-collapse: collapse; }
        .inv-table thead tr { background: #0f172a; }
        .inv-table th { padding: 9px 5px; font-size: 8.5px; font-weight: 900; color: white; text-transform: uppercase; letter-spacing: 0.06em; }
        .inv-table th input { background: transparent; color: white; border: none; outline: none; font-weight: 900; font-size: 8.5px; text-transform: uppercase; width: 100%; text-align: center; }
        .inv-table tbody tr { border-bottom: 1px solid #f1f5f9; }
        .inv-table tbody tr:nth-child(even) { background: #fafbfc; }
        .inv-table td { padding: 10px 5px; font-size: 11px; }
        .inv-table td input { border: none; outline: none; background: transparent; font-size: 11px; width: 100%; }
        .th-sno { width: 30px; text-align: center; }
        .th-desc { text-align: left; padding-left: 10px !important; }
        .th-qty { width: 44px; }
        .th-rate { width: 48px; }
        .th-amt { width: 68px; text-align: right; padding-right: 10px !important; }
        .td-sno { text-align: center; color: #cbd5e1; font-weight: 800; }
        .td-desc { padding-left: 10px !important; }
        .td-qty { text-align: center; }
        .td-rate { text-align: center; }
        .td-amt { text-align: right; font-weight: 900; padding-right: 10px !important; color: #0f172a; }
        .add-row-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 9.5px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.08em; background: none; border: none; cursor: pointer; }

        .totals-wrap { padding: 14px 16px 12px; background: #f8fafc; }
        .total-line { display: flex; justify-content: space-between; align-items: center; padding: 5px 2px; border-bottom: 1px dashed #e2e8f0; margin-bottom: 8px; }
        .total-line-lbl { font-size: 9.5px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
        .total-line-val { font-size: 18px; font-weight: 900; color: #0f172a; }
        .advance-pill { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5; border: 1.5px solid #6ee7b7; border-radius: 12px; padding: 10px 16px; margin-bottom: 10px; }
        .adv-lbl-inp { font-size: 9.5px; font-weight: 900; color: #059669; text-transform: uppercase; letter-spacing: 0.08em; background: transparent; border: none; outline: none; width: 130px; }
        .adv-val-wrap { display: flex; align-items: center; gap: 3px; }
        .adv-symbol { font-size: 11px; color: #059669; opacity: 0.6; font-weight: 700; }
        .adv-val-inp { font-size: 20px; font-weight: 900; color: #059669; background: transparent; border: none; outline: none; text-align: right; width: 90px; }
        .balance-card { background: linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%); border-radius: 14px; padding: 16px 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 6px 24px rgba(15,23,42,0.28); }
        .bal-lbl { font-size: 9px; font-weight: 900; color: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.15em; }
        .bal-val { font-size: 30px; font-weight: 900; color: #fff; letter-spacing: -0.02em; }

        .inv-footer { padding: 14px 16px 16px; border-top: 1.5px solid #e2e8f0; }
        .footer-cols { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 12px; }
        .bank-col { flex: 1; }
        .bank-micro { font-size: 8.5px; font-weight: 900; color: #2563eb; text-transform: uppercase; letter-spacing: 0.12em; display: flex; align-items: center; gap: 4px; margin-bottom: 6px; }
        .bank-inp { display: block; width: 100%; border: none; outline: none; background: transparent; }
        .bank-nm { font-size: 12px; font-weight: 900; color: #0f172a; text-transform: uppercase; }
        .bank-an { font-size: 10px; font-weight: 700; color: #64748b; }
        .bank-no { font-size: 10px; color: #0f172a; font-family: 'Courier New', monospace; letter-spacing: 0.05em; }
        .qr-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .qr-box { width: 68px; height: 68px; background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 10px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; overflow: hidden; }
        .qr-box img { width: 100%; height: 100%; object-fit: cover; padding: 3px; }
        .qr-lbl { font-size: 7.5px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
        .sign-col { flex: 1; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; padding-top: 28px; }
        .sign-line { width: 80px; border-bottom: 1.5px solid #cbd5e1; margin-bottom: 4px; }
        .sign-lbl { font-size: 8px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
        .footer-note { text-align: center; font-size: 8.5px; color: #94a3b8; font-style: italic; line-height: 1.5; margin-bottom: 4px; }
        .footer-thanks { text-align: center; font-size: 9.5px; font-weight: 900; color: #0f172a; text-transform: uppercase; letter-spacing: 0.1em; }

        .action-bar { padding: 12px 16px 20px; background: #f1f5f9; border-top: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 10px; }
        .action-row { display: flex; gap: 10px; }
        .btn { border: none; cursor: pointer; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.09em; display: flex; align-items: center; justify-content: center; gap: 8px; border-radius: 13px; padding: 14px 10px; -webkit-tap-highlight-color: transparent; }
        .btn-print { flex: 1; background: #0f172a; color: white; }
        .btn-share { flex: 1; background: #10b981; color: white; }
        .btn-reset { width: 100%; background: white; color: #ef4444; border: 1.5px solid #fecaca !important; }
        .brand-foot { text-align: center; padding: 14px 0 8px; font-size: 7.5px; font-weight: 900; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.4em; }

        /* ══════════════════════════════════════════
           PRINT — FORCES SINGLE A4 PAGE
           The .print-page div is hidden on screen,
           shown only when printing. All screen UI
           is hidden via .no-print.
        ══════════════════════════════════════════ */
        @media print {
          @page { size: A4 portrait; margin: 0; }

          html, body {
            width: 210mm; height: 297mm;
            overflow: hidden;
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #app-root { background: white !important; padding: 0 !important; min-height: unset !important; }
          .screen-card { display: none !important; }
          .brand-foot { display: none !important; }
          .no-print { display: none !important; }

          /* Show the dedicated print sheet */
          .print-page {
            display: flex !important;
            flex-direction: column;
            width: 210mm;
            height: 297mm;
            overflow: hidden;
            position: fixed;
            top: 0; left: 0;
            background: white;
            font-family: 'Segoe UI', Arial, sans-serif;
            page-break-after: avoid;
            page-break-inside: avoid;
          }

          /* ─ Print Header ─ */
          .p-header {
            background: #ffffff !important;
            padding: 10mm 12mm 8mm;
            display: flex; justify-content: space-between; align-items: flex-start;
            flex-shrink: 0;
          }
          .p-logo { width: 28mm; height: 15mm; object-fit: contain; }
          .p-co-block { flex: 1; padding-left: 5mm; }
          .p-co-name { font-size: 17pt; font-weight: 900; color: #0f172a !important; text-transform: uppercase; letter-spacing: 0.04em; line-height: 1.1; }
          .p-co-sub { font-size: 7pt; color: #0f172a !important; line-height: 1.5; margin-top: 1mm; }
          .p-inv-block { text-align: right; }
          .p-inv-label { font-size: 12pt; font-weight: 900; color: #2563eb !important; letter-spacing: 0.2em; text-transform: uppercase; }
          .p-inv-no { font-size: 11pt; font-weight: 900; color: white !important; margin-top: 1mm; }
          .p-inv-date { font-size: 7.5pt; color: white !important; margin-top: 1mm; }

          /* ─ Print Bill Row ─ */
          .p-bill-row { display: flex; border-bottom: 2pt solid #0f172a; flex-shrink: 0; }
          .p-bill-to { flex: 1; padding: 5mm 10mm; border-right: 2pt solid #0f172a; background: #f8fafc !important; }
          .p-bill-right { flex: 1; padding: 5mm 10mm; display: flex; flex-direction: column; justify-content: center; }
          .p-bill-micro { font-size: 7pt; font-weight: 900; color: #2563eb !important; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 2mm; }
          .p-client-name { font-size: 13pt; font-weight: 800; color: #0f172a; }
          .p-det-row { display: flex; justify-content: space-between; margin-bottom: 2mm; }
          .p-det-lbl { font-size: 7pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; }
          .p-det-val { font-size: 8pt; font-weight: 900; color: #0f172a; }

          /* ─ Print Table ─ */
          .p-table { width: 100%; border-collapse: collapse; flex-shrink: 0; }
          .p-table thead tr { background: #0f172a !important; }
          .p-table th { padding: 3mm 3mm; font-size: 7.5pt; font-weight: 900; color: white !important; text-transform: uppercase; letter-spacing: 0.06em; }
          .p-table td { padding: 3.5mm 3mm; font-size: 9pt; border-bottom: 0.5pt solid #e2e8f0; }
          .p-table tbody tr:nth-child(even) td { background: #fafbfc !important; }
          .p-th-sno { width: 8mm; text-align: center; }
          .p-th-desc { text-align: left; padding-left: 5mm !important; }
          .p-th-qty { width: 14mm; text-align: center; }
          .p-th-rate { width: 18mm; text-align: center; }
          .p-th-amt { width: 28mm; text-align: right; padding-right: 5mm !important; }
          .p-td-sno { text-align: center; color: #cbd5e1; font-weight: 800; }
          .p-td-desc { padding-left: 5mm !important; font-weight: 700; }
          .p-td-qty { text-align: center; }
          .p-td-rate { text-align: center; font-weight: 700; color: #2563eb !important; }
          .p-td-amt { text-align: right; font-weight: 900; padding-right: 5mm !important; }

          /* ─ Print Totals ─ */
          .p-totals { padding: 5mm 12mm; background: #f8fafc !important; flex-shrink: 0; }
          .p-grand-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 3mm; border-bottom: 0.5pt dashed #cbd5e1; margin-bottom: 4mm; }
          .p-grand-lbl { font-size: 7.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
          .p-grand-val { font-size: 15pt; font-weight: 900; color: #0f172a; }
          .p-adv-row { display: flex; justify-content: space-between; align-items: center; background: #ecfdf5 !important; border: 1pt solid #6ee7b7; border-radius: 2.5mm; padding: 3mm 5mm; margin-bottom: 4mm; }
          .p-adv-lbl { font-size: 7.5pt; font-weight: 900; color: #059669 !important; text-transform: uppercase; letter-spacing: 0.08em; }
          .p-adv-val { font-size: 14pt; font-weight: 900; color: #059669 !important; }
          .p-bal-card { background: #0f172a !important; border-radius: 3mm; padding: 5mm 8mm; display: flex; justify-content: space-between; align-items: center; }
          .p-bal-lbl { font-size: 7.5pt; font-weight: 900; color: rgba(255,255,255,0.45) !important; text-transform: uppercase; letter-spacing: 0.15em; }
          .p-bal-val { font-size: 22pt; font-weight: 900; color: white !important; }

          /* ─ Spacer pushes footer to bottom ─ */
          .p-spacer { flex: 1; }

          /* ─ Print Footer ─ */
          .p-footer { padding: 5mm 12mm; border-top: 1pt solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-start; gap: 8mm; flex-shrink: 0; }
          .p-bank-col { flex: 1; }
          .p-bank-micro { font-size: 7pt; font-weight: 900; color: #2563eb !important; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 2mm; }
          .p-bank-name { font-size: 10pt; font-weight: 900; text-transform: uppercase; color: #0f172a; }
          .p-bank-acc { font-size: 8pt; color: #64748b; margin-top: 1mm; }
          .p-bank-no { font-size: 8pt; color: #0f172a; font-family: 'Courier New', monospace; }
          .p-qr-col { display: flex; flex-direction: column; align-items: center; gap: 2mm; }
          .p-qr-img { width: 22mm; height: 22mm; object-fit: contain; }
          .p-qr-lbl { font-size: 6pt; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }
          .p-sign-col { flex: 1; display: flex; flex-direction: column; align-items: flex-end; justify-content: flex-end; padding-top: 8mm; }
          .p-sign-line { width: 30mm; border-bottom: 1pt solid #cbd5e1; margin-bottom: 2mm; }
          .p-sign-lbl { font-size: 6.5pt; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.1em; }

          /* ─ Print Bottom Strip ─ */
          .p-strip { background: #0f172a !important; padding: 3mm 12mm; text-align: center; flex-shrink: 0; }
          .p-strip-note { font-size: 7pt; color: rgba(255,255,255,0.5) !important; font-style: italic; }
          .p-strip-thanks { font-size: 8pt; font-weight: 900; color: white !important; text-transform: uppercase; letter-spacing: 0.12em; margin-top: 1mm; }
        }
      `}</style>

      {/* ═══════════ SCREEN VIEW ═══════════ */}
      <div className="screen-card">

        {/* Header Band */}
        <div className="inv-top-band">
          <div className="inv-top-left">
            <div className="logo-btn no-print" onClick={() => logoRef.current?.click()}>
              {logo ? <img src={logo} alt="Logo" /> : <Camera size={18} color="rgba(255,255,255,0.35)" />}
              <input type="file" ref={logoRef} hidden accept="image/*" onChange={e => handleImage(e, setLogo)} />
            </div>
            <input className="co-name" value={companyName} onChange={e => setCompanyName(e.target.value)} />
            <input className="co-sub" value={engineerName} onChange={e => setEngineerName(e.target.value)} />
            <input className="co-sub" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div style={{ textAlign: 'right' }}>
            <input className="inv-label-input" value={invoiceLabel} onChange={e => setInvoiceLabel(e.target.value)} />
          </div>
        </div>

        {/* Bill Info */}
        <div className="bill-row">
          <div className="bill-to-cell">
            <p className="cell-micro">Bill To</p>
            <input className="client-inp" value={clientName} onChange={e => setClientName(e.target.value)} />
          </div>
          <div className="bill-details-cell">
            <div className="det-row">
              <span className="det-lbl">Invoice No:</span>
              <input className="det-val" value={invoiceNo} onChange={e => setInvoiceNo(e.target.value)} style={{ width: 80 }} />
            </div>
            <div className="det-row">
              <span className="det-lbl">Date:</span>
              <input type="date" className="det-val" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} style={{ width: 100, fontSize: 9 }} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="inv-table">
            <thead>
              <tr>
                <th className="th-sno"><input value={snoLabel} onChange={e => setSnoLabel(e.target.value)} /></th>
                <th className="th-desc">DESCRIPTION</th>
                <th className="th-qty"><input value={qtyLabel} onChange={e => setQtyLabel(e.target.value)} /></th>
                <th className="th-rate"><input value={rateLabel} onChange={e => setRateLabel(e.target.value)} /></th>
                <th className="th-amt"><input value={amtLabel} onChange={e => setAmtLabel(e.target.value)} style={{ textAlign: 'right', color: 'white' }} /></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id}>
                  <td className="td-sno">{i + 1}</td>
                  <td className="td-desc">
                    <input style={{ fontWeight: 700, color: '#334155' }} value={row.description} onChange={e => updateRow(row.id, 'description', e.target.value)} />
                  </td>
                  <td className="td-qty">
                    <input style={{ textAlign: 'center' }} value={row.quantity} onChange={e => updateRow(row.id, 'quantity', e.target.value)} />
                  </td>
                  <td className="td-rate">
                    <input style={{ textAlign: 'center', fontWeight: 700, color: '#2563eb' }} value={row.rate} onChange={e => updateRow(row.id, 'rate', e.target.value)} />
                  </td>
                  <td className="td-amt">₹{((Number(row.quantity) || 0) * (Number(row.rate) || 0)).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button className="add-row-btn no-print" onClick={() => setRows([...rows, { id: Date.now(), description: '', quantity: '', rate: '' }])}>
            <Plus size={13} /> Add Line Item
          </button>
        </div>

        {/* Totals */}
        <div className="totals-wrap">
          <div className="total-line">
            <span className="total-line-lbl">Grand Total</span>
            <span className="total-line-val">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="advance-pill">
            <input className="adv-lbl-inp" value={advanceLabel} onChange={e => setAdvanceLabel(e.target.value)} />
            <div className="adv-val-wrap">
              <span className="adv-symbol">₹</span>
              <input className="adv-val-inp" value={advanceInput} onChange={e => setAdvanceInput(e.target.value)} />
            </div>
          </div>
          <div className="balance-card">
            <span className="bal-lbl">Balance Due</span>
            <span className="bal-val">₹{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="inv-footer">
          <div className="footer-cols">
            <div className="bank-col">
              <p className="bank-micro"><Landmark size={9} /> Bank Info</p>
              <input className="bank-inp bank-nm" value={bankName} onChange={e => setBankName(e.target.value)} />
              <input className="bank-inp bank-an" value={accName} onChange={e => setAccName(e.target.value)} />
              <input className="bank-inp bank-no" value={accNo} onChange={e => setAccNo(e.target.value)} />
            </div>
            <div className="qr-col">
              <div className="qr-box no-print" onClick={() => qrRef.current?.click()}>
                {qrCode
                  ? <img src={qrCode} alt="QR" />
                  : <><QrCode size={18} color="#cbd5e1" /><span style={{ fontSize: 7, color: '#94a3b8', fontWeight: 700 }}>QR</span></>}
                <input type="file" ref={qrRef} hidden accept="image/*" onChange={e => handleImage(e, setQrCode)} />
              </div>
              <span className="qr-lbl">Scan to Pay</span>
            </div>
          </div>
          <p className="footer-note">*Please verify drawings and dimensions before execution.</p>
          <p className="footer-thanks">Thank you for choosing {companyName}</p>
        </div>

        {/* Buttons */}
        <div className="action-bar no-print">
          <div className="action-row">
            <button className="btn btn-print" onClick={() => window.print()}><Download size={15} /> Print PDF</button>
            <button className="btn btn-share" onClick={onShare}><Share2 size={15} /> Share</button>
          </div>
          <button className="btn btn-reset" onClick={handleReset}><RotateCcw size={15} /> Reset</button>
        </div>
      </div>

      <p className="brand-foot no-print">Uniq Designs · Invoice System</p>

      {/* ═══════════════════════════════════════════════
          PRINT-ONLY A4 SINGLE PAGE
          display:none on screen → display:flex on print
      ═══════════════════════════════════════════════ */}
      <div className="print-page" style={{ display: 'none' }}>

        {/* Header */}
        <div className="p-header">
          <div>{logo && <img src={logo} alt="Logo" className="p-logo" />}</div>
          <div className="p-co-block">
            <div className="p-co-name">{companyName}</div>
            <div className="p-co-sub">{engineerName}</div>
            <div className="p-co-sub">{address}</div>
          </div>
          <div className="p-inv-block">
            <div className="p-inv-label">{invoiceLabel}</div>
            <div className="p-inv-no">{invoiceNo}</div>
            <div className="p-inv-date">{formatDate(invoiceDate)}</div>
          </div>
        </div>

        {/* Bill Row */}
        <div className="p-bill-row">
          <div className="p-bill-to">
            <div className="p-bill-micro">Bill To</div>
            <div className="p-client-name">{clientName}</div>
          </div>
          <div className="p-bill-right">
            <div className="p-det-row">
              <span className="p-det-lbl">Invoice No:</span>
              <span className="p-det-val">{invoiceNo}</span>
            </div>
            <div className="p-det-row">
              <span className="p-det-lbl">Date:</span>
              <span className="p-det-val">{formatDate(invoiceDate)}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <table className="p-table">
          <thead>
            <tr>
              <th className="p-th-sno">{snoLabel}</th>
              <th className="p-th-desc">Description</th>
              <th className="p-th-qty">{qtyLabel}</th>
              <th className="p-th-rate">{rateLabel}</th>
              <th className="p-th-amt">{amtLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id}>
                <td className="p-td-sno">{i + 1}</td>
                <td className="p-td-desc">{row.description}</td>
                <td className="p-td-qty">{row.quantity}</td>
                <td className="p-td-rate">{row.rate}</td>
                <td className="p-td-amt">₹{((Number(row.quantity) || 0) * (Number(row.rate) || 0)).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length < 5 && Array.from({ length: 5 - rows.length }).map((_, i) => (
              <tr key={`filler-${i}`}>
                <td className="p-td-sno" style={{ color: 'transparent' }}>·</td>
                <td className="p-td-desc" style={{ color: 'transparent' }}>·</td>
                <td /><td /><td />
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="p-totals">
          <div className="p-grand-row">
            <span className="p-grand-lbl">Grand Total</span>
            <span className="p-grand-val">₹{totalAmount.toLocaleString()}</span>
          </div>
          <div className="p-adv-row">
            <span className="p-adv-lbl">{advanceLabel}</span>
            <span className="p-adv-val">₹{Number(advanceInput).toLocaleString()}</span>
          </div>
          <div className="p-bal-card">
            <span className="p-bal-lbl">Balance Due</span>
            <span className="p-bal-val">₹{balance.toLocaleString()}</span>
          </div>
        </div>

        {/* Flexible spacer pushes footer to bottom */}
        <div className="p-spacer" />

        {/* Footer */}
        <div className="p-footer">
          <div className="p-bank-col">
            <div className="p-bank-micro">Bank Info</div>
            <div className="p-bank-name">{bankName}</div>
            <div className="p-bank-acc">{accName}</div>
            <div className="p-bank-no">A/C: {accNo}</div>
          </div>
          {qrCode && (
            <div className="p-qr-col">
              <img src={qrCode} alt="QR Code" className="p-qr-img" />
              <span className="p-qr-lbl">Scan to Pay</span>
            </div>
          )}
        </div>

        {/* Bottom Strip */}
        <div className="p-strip">
          <div className="p-strip-note">*Please verify drawings and dimensions before execution.</div>
          <div className="p-strip-thanks">Thank you for choosing {companyName}</div>
        </div>

      </div>
    </div>
  );
};

export default PaymentTracker;
