import {
  getRecord,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
} from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialRecord } from "@/lib/api";
import { FormField } from "@/components/ui/FormField";
import { Th, TableEmpty } from "@/components/ui/table";
import { useEffect, useState, useCallback } from "react";
import { formatCurrency, parseApiError } from "@/lib/utils";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

const INCOME_CATEGORIES = [
  "SALARY",
  "FREELANCE",
  "INVESTMENT",
  "BUSINESS",
  "RENTAL",
  "OTHER_INCOME",
];
const EXPENSE_CATEGORIES = [
  "FOOD",
  "TRANSPORT",
  "UTILITIES",
  "HEALTH",
  "EDUCATION",
  "ENTERTAINMENT",
  "SHOPPING",
  "RENT",
  "TAX",
  "OTHER_EXPENSE",
];
const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

const EMPTY_FORM = {
  amount: "",
  type: "INCOME",
  category: "SALARY",
  date: "",
  notes: "",
};
const EMPTY_FILTERS = {
  type: "",
  category: "",
  date: "",
  date_from: "",
  date_to: "",
  search: "",
};
const PAGE_SIZE = 10;

const FILTER_CLS =
  "rounded-lg border border-gray-200 px-3 py-1.5 text-sm outline-none focus:border-blue-500 bg-white";

export default function FinancialRecordsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const isAnalyst = user?.role === "ANALYST";
  const isAnalystOrAdmin = isAnalyst || isAdmin;

  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  // Edit / create modal (ADMIN only)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<FinancialRecord | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Detail modal (ANALYST: read-only via GET /api/finance/records/<uuid>/)
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<FinancialRecord | null>(
    null,
  );
  const [detailLoading, setDetailLoading] = useState(false);

  const loadRecords = useCallback(() => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(page),
      page_size: String(PAGE_SIZE),
    };
    if (isAnalystOrAdmin) {
      // If exact date is set it takes precedence (backend ignores date_from/date_to when date is present)
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params[k] = v;
      });
    }
    getRecords(params)
      .then((res) => {
        setRecords(res.results);
        setTotal(res.count);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, filters, isAnalystOrAdmin]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // ─── Edit / create (ADMIN) ───────────────────────────────────────────────────

  const openCreate = () => {
    setEditRecord(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setEditDialogOpen(true);
  };

  const openEdit = (r: FinancialRecord) => {
    setEditRecord(r);
    setForm({
      amount: r.amount,
      type: r.type,
      category: r.category,
      date: r.date,
      notes: r.notes || "",
    });
    setFormError("");
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    setFormError("");
    setSaving(true);
    try {
      await (editRecord
        ? updateRecord(editRecord.id, form)
        : createRecord(form));
      setEditDialogOpen(false);
      loadRecords();
    } catch (err) {
      setFormError(parseApiError(err, "Save failed."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try {
      await deleteRecord(id);
      loadRecords();
    } catch {
      alert("Delete failed. Please try again.");
    }
  };

  // ─── Detail view (ANALYST: GET /api/finance/records/<uuid>/) ─────────────────

  const openDetail = async (r: FinancialRecord) => {
    setDetailRecord(r); // show immediately from list data
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await getRecord(r.id);
      setDetailRecord(res.record); // refresh with authoritative server data
    } catch {
      alert("Failed to load record details. Please try again.");
      // keep the list data if the fetch fails
    } finally {
      setDetailLoading(false);
    }
  };

  // ─── Filters ─────────────────────────────────────────────────────────────────

  const setFilter = (key: keyof typeof EMPTY_FILTERS, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const categories =
    form.type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const colSpan = isAdmin ? 6 : 5;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Financial Records
        </h2>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="size-4" /> Add Record
          </button>
        )}
      </div>

      {/* Filters – ANALYST / ADMIN only */}
      {isAnalystOrAdmin && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <select
            value={filters.type}
            onChange={(e) => {
              setFilter("type", e.target.value);
              setFilter("category", "");
            }}
            className={FILTER_CLS}
          >
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>

          <select
            value={filters.category}
            onChange={(e) => setFilter("category", e.target.value)}
            className={FILTER_CLS}
          >
            <option value="">All Categories</option>
            {(filters.type === "INCOME"
              ? INCOME_CATEGORIES
              : filters.type === "EXPENSE"
                ? EXPENSE_CATEGORIES
                : ALL_CATEGORIES
            ).map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>

          <label className="flex flex-col gap-0.5 text-xs text-gray-500">
            Exact date
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilter("date", e.target.value)}
              className={FILTER_CLS}
            />
          </label>

          <label className="flex flex-col gap-0.5 text-xs text-gray-500">
            From
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilter("date_from", e.target.value)}
              className={FILTER_CLS}
            />
          </label>
          <label className="flex flex-col gap-0.5 text-xs text-gray-500">
            To
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilter("date_to", e.target.value)}
              className={FILTER_CLS}
            />
          </label>

          <input
            type="text"
            value={filters.search}
            onChange={(e) => setFilter("search", e.target.value)}
            placeholder="Search notes..."
            className={FILTER_CLS}
          />

          <button
            onClick={() => {
              setFilters(EMPTY_FILTERS);
              setPage(1);
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <Th>Date</Th>
              <Th>Category</Th>
              <Th>Type</Th>
              <Th align="right">Amount</Th>
              <Th>Notes</Th>
              {isAdmin && <Th className="w-20" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading || records.length === 0 ? (
              <TableEmpty
                colSpan={colSpan}
                loading={loading}
                emptyText="No records found."
              />
            ) : (
              records.map((r) => (
                <tr
                  key={r.id}
                  className={`hover:bg-gray-50 transition-colors ${isAnalyst ? "cursor-pointer" : ""}`}
                  onClick={isAnalyst ? () => openDetail(r) : undefined}
                >
                  <td className="px-5 py-3 text-sm text-gray-600 whitespace-nowrap">
                    {r.date}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-800">
                    {r.category.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-3">
                    <TypeBadge type={r.type} />
                  </td>
                  <td
                    className={`px-5 py-3 text-sm font-medium text-right whitespace-nowrap ${r.type === "INCOME" ? "text-green-600" : "text-red-500"}`}
                  >
                    {r.type === "INCOME" ? "+" : "−"}
                    {formatCurrency(r.amount)}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-400 max-w-50 truncate">
                    {r.notes || "—"}
                  </td>
                  {isAdmin && (
                    <td
                      className="px-5 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => openEdit(r)}
                          className="text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of{" "}
            {total} records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="text-sm text-gray-600">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ADMIN: Add / Edit modal */}
      <Modal
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        title={editRecord ? "Edit Record" : "Add Record"}
        error={formError}
        onSave={handleSave}
        saving={saving}
        saveLabel={editRecord ? "Save Changes" : "Add Record"}
      >
        <FormField label="Type">
          <Select
            value={form.type}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                type: e.target.value,
                category: e.target.value === "INCOME" ? "SALARY" : "FOOD",
              }))
            }
          >
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </Select>
        </FormField>
        <FormField label="Category">
          <Select
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Amount">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            placeholder="0.00"
          />
        </FormField>
        <FormField label="Date">
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
          />
        </FormField>
        <FormField label="Notes" hint="(optional)">
          <textarea
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
          />
        </FormField>
      </Modal>

      {/* ANALYST: Read-only detail modal (GET /api/finance/records/<uuid>/) */}
      <Modal
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailRecord(null);
        }}
        title="Record Detail"
      >
        {detailLoading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : detailRecord ? (
          <dl className="space-y-3">
            <DetailRow label="Date" value={detailRecord.date} />
            <DetailRow
              label="Type"
              value={<TypeBadge type={detailRecord.type} />}
            />
            <DetailRow
              label="Category"
              value={detailRecord.category.replace(/_/g, " ")}
            />
            <DetailRow
              label="Amount"
              value={
                <span
                  className={
                    detailRecord.type === "INCOME"
                      ? "text-green-600 font-semibold"
                      : "text-red-500 font-semibold"
                  }
                >
                  {detailRecord.type === "INCOME" ? "+" : "−"}
                  {formatCurrency(detailRecord.amount)}
                </span>
              }
            />
            <DetailRow label="Notes" value={detailRecord.notes || "—"} />
            <DetailRow
              label="Created"
              value={new Date(detailRecord.created_at).toLocaleString()}
            />
            <DetailRow
              label="Updated"
              value={new Date(detailRecord.updated_at).toLocaleString()}
            />
          </dl>
        ) : null}
      </Modal>
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${type === "INCOME" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}
    >
      {type}
    </span>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-sm font-medium text-gray-500 shrink-0">{label}</dt>
      <dd className="text-sm text-gray-800 text-right">{value}</dd>
    </div>
  );
}
