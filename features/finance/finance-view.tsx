"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Filter,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import type {
  Client,
  FinanceStatus,
  FinanceTransaction,
  FinanceTransactionInput,
  FinanceTransactionType,
  Project,
} from "@/lib/types";

const typeLabel: Record<FinanceTransactionType, string> = { Income: "دخل", Expense: "مصروف" };
const statusLabel: Record<FinanceStatus, string> = { Pending: "معلّق", Paid: "مدفوع", Cancelled: "ملغي" };

const monthFormatter = new Intl.DateTimeFormat("ar-SA", { month: "short" });
const dateFormatter = new Intl.DateTimeFormat("ar-SA", { day: "numeric", month: "short", year: "numeric" });

function formatMoney(value: number, currency = "SAR") {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function FinanceView({
  items,
  projects,
  clients,
  onCreate,
  onEdit,
  onDelete,
}: {
  items: FinanceTransaction[];
  projects: Project[];
  clients: Client[];
  onCreate: () => void;
  onEdit: (item: FinanceTransaction) => void;
  onDelete: (item: FinanceTransaction) => void;
}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<"All" | FinanceTransactionType>("All");

  const visible = useMemo(
    () =>
      items.filter(
        (item) =>
          (type === "All" || item.type === type) &&
          (!q ||
            [item.description, item.category, item.notes].some((value) =>
              (value ?? "").toLowerCase().includes(q.toLowerCase()),
            )),
      ),
    [items, q, type],
  );

  const primaryCurrency = useMemo(() => {
    const counts = new Map<string, number>();
    items.forEach((item) => counts.set(item.currency, (counts.get(item.currency) ?? 0) + 1));
    if (counts.has("SAR")) return "SAR";
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "SAR";
  }, [items]);

  const currencies = useMemo(() => [...new Set(items.map((item) => item.currency))], [items]);
  const primaryPaid = items.filter((item) => item.status === "Paid" && item.currency === primaryCurrency);
  const income = primaryPaid.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount), 0);
  const expense = primaryPaid.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount), 0);

  const monthly = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthItems = items.filter((item) => {
        const itemDate = new Date(item.transaction_date);
        return item.status === "Paid" && item.currency === primaryCurrency && itemDate.getMonth() === month && itemDate.getFullYear() === year;
      });
      return {
        label: monthFormatter.format(date),
        income: monthItems.filter((item) => item.type === "Income").reduce((sum, item) => sum + Number(item.amount), 0),
        expense: monthItems.filter((item) => item.type === "Expense").reduce((sum, item) => sum + Number(item.amount), 0),
      };
    });
  }, [items, primaryCurrency]);

  const maxMonthly = Math.max(1, ...monthly.flatMap((month) => [month.income, month.expense]));
  const recent = [...items].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 5);
  const categoryTotals = useMemo(() => {
    const totals = new Map<string, number>();
    primaryPaid
      .filter((item) => item.type === "Expense")
      .forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount)));
    return [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [primaryPaid]);
  const maxCategory = Math.max(1, ...categoryTotals.map(([, amount]) => amount));

  const metricValue = (value: number) => (items.length ? formatMoney(value, primaryCurrency) : "—");

  return (
    <section className="finance-panel">
      <div className="finance-summary">
        <FinanceMetric icon={<ArrowUpRight />} label="إجمالي الدخل" value={metricValue(income)} tone="income" />
        <FinanceMetric icon={<ArrowDownLeft />} label="إجمالي المصروفات" value={metricValue(expense)} tone="expense" />
        <FinanceMetric icon={<Wallet />} label="صافي التدفق" value={metricValue(income - expense)} tone={income - expense >= 0 ? "income" : "expense"} />
        <FinanceMetric icon={<CircleDollarSign />} label="المعاملات" value={items.length ? String(items.length) : "—"} tone="neutral" />
      </div>

      {currencies.length > 1 && (
        <p className="finance-currency-note">
          المؤشرات محسوبة بعملة {primaryCurrency} فقط. توجد معاملات إضافية بعملات: {currencies.filter((currency) => currency !== primaryCurrency).join("، ")}.
        </p>
      )}

      <div className="finance-toolbar">
        <label className="search-box">
          <Search size={17} />
          <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="ابحث في الوصف أو التصنيف…" />
        </label>
        <label className="finance-filter">
          <Filter size={16} />
          <select value={type} onChange={(event) => setType(event.target.value as typeof type)}>
            <option value="All">كل المعاملات</option>
            <option value="Income">الدخل</option>
            <option value="Expense">المصروفات</option>
          </select>
        </label>
      </div>

      {items.length > 0 && (
        <div className="finance-insights-grid">
          <article className="finance-insight finance-chart-card">
            <header>
              <div><span className="section-kicker">CASH FLOW</span><h2>الدخل والمصروفات</h2></div>
              <small>آخر 6 أشهر · {primaryCurrency}</small>
            </header>
            <div className="finance-chart" aria-label="مقارنة الدخل والمصروفات خلال آخر ستة أشهر">
              {monthly.map((month) => (
                <div className="finance-chart-month" key={month.label}>
                  <div className="finance-bars">
                    <i className="income-bar" style={{ height: `${Math.max(month.income ? 8 : 0, (month.income / maxMonthly) * 100)}%` }} title={`دخل: ${formatMoney(month.income, primaryCurrency)}`} />
                    <i className="expense-bar" style={{ height: `${Math.max(month.expense ? 8 : 0, (month.expense / maxMonthly) * 100)}%` }} title={`مصروف: ${formatMoney(month.expense, primaryCurrency)}`} />
                  </div>
                  <span>{month.label}</span>
                </div>
              ))}
            </div>
            <footer className="finance-chart-legend"><span><i className="income-dot" /> الدخل</span><span><i className="expense-dot" /> المصروفات</span></footer>
          </article>

          <article className="finance-insight">
            <header><div><span className="section-kicker">EXPENSES</span><h2>أعلى التصنيفات إنفاقًا</h2></div></header>
            {categoryTotals.length ? (
              <div className="finance-categories">
                {categoryTotals.map(([category, amount]) => (
                  <div className="finance-category" key={category}>
                    <div><b>{category}</b><span>{formatMoney(amount, primaryCurrency)}</span></div>
                    <em><i style={{ width: `${(amount / maxCategory) * 100}%` }} /></em>
                  </div>
                ))}
              </div>
            ) : <div className="mini-empty">لا توجد مصروفات مدفوعة بعد.</div>}
          </article>
        </div>
      )}

      {visible.length ? (
        <div className="finance-table-section">
          <div className="finance-section-title"><div><span className="section-kicker">TRANSACTIONS</span><h2>{q || type !== "All" ? "نتائج البحث" : "آخر المعاملات"}</h2></div><small>{visible.length} معاملة</small></div>
          <div className="finance-table-wrap">
            <table className="finance-table">
              <thead><tr><th>التاريخ</th><th>النوع</th><th>الوصف</th><th>الارتباط</th><th>الحالة</th><th>المبلغ</th><th /></tr></thead>
              <tbody>{(q || type !== "All" ? visible : recent).map((item) => (
                <tr key={item.id}>
                  <td><span className="date-cell"><CalendarDays size={14} />{dateFormatter.format(new Date(item.transaction_date))}</span></td>
                  <td><span className={`finance-type ${item.type.toLowerCase()}`}>{item.type === "Income" ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />} {typeLabel[item.type]}</span></td>
                  <td><b>{item.description}</b><small>{item.category}</small></td>
                  <td>{projects.find((project) => project.id === item.project_id)?.name || clients.find((client) => client.id === item.client_id)?.name || "—"}</td>
                  <td><span className={`finance-status ${item.status.toLowerCase()}`}>{statusLabel[item.status]}</span></td>
                  <td className={item.type === "Income" ? "amount-income" : "amount-expense"}>{item.type === "Income" ? "+" : "-"}{formatMoney(Number(item.amount), item.currency)}</td>
                  <td><div className="table-actions"><button onClick={() => onEdit(item)} aria-label="تعديل"><Pencil size={14} /></button><button className="danger" onClick={() => onDelete(item)} aria-label="حذف"><Trash2 size={14} /></button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="empty-state finance-empty">
          <span><Wallet /></span>
          <h3>{items.length ? "لا توجد نتائج مطابقة." : "ابدأ تسجيل حركة أعمالك المالية."}</h3>
          <p>{items.length ? "جرّب تغيير البحث أو عامل التصفية." : "أضف أول دخل أو مصروف لتحصل على مؤشرات وتقارير مفيدة هنا."}</p>
          {!items.length && <button className="primary compact" onClick={onCreate}><Plus size={16} /> أضف أول معاملة</button>}
        </div>
      )}
    </section>
  );
}

function FinanceMetric({ icon, label, value, tone }: { icon: ReactNode; label: string; value: string; tone: string }) {
  return <article className={`finance-metric ${tone}`}><span>{icon}</span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

export function FinanceModal({ item, projects, clients, onClose, onSave }: { item: FinanceTransaction | null; projects: Project[]; clients: Client[]; onClose: () => void; onSave: (input: FinanceTransactionInput, current?: FinanceTransaction) => Promise<boolean> }) {
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const input: FinanceTransactionInput = {
      type: String(form.get("type")) as FinanceTransactionType,
      category: String(form.get("category") || "General").trim(),
      description: String(form.get("description") || "").trim(),
      amount: Number(form.get("amount") || 0),
      currency: String(form.get("currency") || "SAR").toUpperCase(),
      status: String(form.get("status")) as FinanceStatus,
      transaction_date: String(form.get("transaction_date")),
      project_id: String(form.get("project_id") || "") || null,
      client_id: String(form.get("client_id") || "") || null,
      notes: String(form.get("notes") || "").trim() || null,
    };
    if (!await onSave(input, item ?? undefined)) setSaving(false);
  }
  return <div className="modal-backdrop"><div className="project-modal"><div className="modal-head"><div><span className="section-kicker">FINANCE</span><h2>{item ? "تعديل المعاملة" : "معاملة مالية جديدة"}</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></div><form className="project-form" onSubmit={submit}><label><span>النوع</span><select name="type" defaultValue={item?.type || "Expense"}><option value="Income">دخل</option><option value="Expense">مصروف</option></select></label><label><span>الحالة</span><select name="status" defaultValue={item?.status || "Paid"}><option value="Paid">مدفوع</option><option value="Pending">معلّق</option><option value="Cancelled">ملغي</option></select></label><label className="full"><span>الوصف *</span><input name="description" required defaultValue={item?.description || ""} /></label><label><span>التصنيف *</span><input name="category" required defaultValue={item?.category || "General"} /></label><label><span>التاريخ *</span><input type="date" name="transaction_date" required defaultValue={item?.transaction_date || new Date().toISOString().slice(0, 10)} /></label><label><span>المبلغ *</span><input type="number" min="0" step="0.01" name="amount" required defaultValue={item?.amount ?? 0} /></label><label><span>العملة</span><input name="currency" maxLength={3} defaultValue={item?.currency || "SAR"} /></label><label><span>المشروع</span><select name="project_id" defaultValue={item?.project_id || ""}><option value="">بدون مشروع</option>{projects.map((project) => <option value={project.id} key={project.id}>{project.name}</option>)}</select></label><label><span>العميل</span><select name="client_id" defaultValue={item?.client_id || ""}><option value="">بدون عميل</option>{clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label><label className="full"><span>ملاحظات</span><textarea name="notes" rows={4} defaultValue={item?.notes || ""} /></label><div className="form-actions full"><button type="button" onClick={onClose}>إلغاء</button><button className="primary" disabled={saving}>{saving ? "جارٍ الحفظ…" : "حفظ"}</button></div></form></div></div>;
}
