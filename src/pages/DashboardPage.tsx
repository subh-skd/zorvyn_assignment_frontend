import { getDashboard } from "@/lib/api";
import { Th } from "@/components/ui/table";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/lib/api";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboard()
      .then(setData)
      .catch(() => setError("Failed to load dashboard."))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 text-sm text-gray-400">Loading dashboard...</div>
    );
  if (error) return <div className="p-8 text-sm text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="p-8 max-w-6xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <SummaryCard
          icon={<TrendingUp className="size-4" />}
          label="Total Income"
          color="text-green-600"
        >
          {formatCurrency(data.summary.total_income)}
        </SummaryCard>
        <SummaryCard
          icon={<TrendingDown className="size-4" />}
          label="Total Expenses"
          color="text-red-500"
        >
          {formatCurrency(data.summary.total_expense)}
        </SummaryCard>
        <SummaryCard
          icon={<DollarSign className="size-4" />}
          label="Net Balance"
          color="text-blue-600"
        >
          <span
            className={
              data.summary.net_balance >= 0 ? "text-gray-900" : "text-red-600"
            }
          >
            {formatCurrency(data.summary.net_balance)}
          </span>
        </SummaryCard>
      </div>

      {/* Recent activity + Monthly trends */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Panel title="Recent Activity">
          {data.recent_activity.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">
              No recent records.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.recent_activity.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {r.category.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-gray-400">{r.date}</p>
                  </div>
                  <span
                    className={`text-sm font-semibold ${r.type === "INCOME" ? "text-green-600" : "text-red-500"}`}
                  >
                    {r.type === "INCOME" ? "+" : "−"}
                    {formatCurrency(Number(r.amount))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Monthly Trends">
          {data.monthly_trends.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-400">No monthly data.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.monthly_trends.map((t) => (
                <div key={t.month} className="px-5 py-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">
                      {t.month}
                    </span>
                    <span
                      className={`text-xs font-semibold ${t.income - t.expense >= 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {formatCurrency(t.income - t.expense)}
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">
                      ↑ {formatCurrency(t.income)}
                    </span>
                    <span className="text-red-500">
                      ↓ {formatCurrency(t.expense)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Weekly trends */}
      {data.weekly_trends.length > 0 && (
        <Panel title="Weekly Trends">
          <div className="divide-y divide-gray-100">
            {data.weekly_trends.map((t) => (
              <div key={t.week_starting} className="px-5 py-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    Week of {t.week_starting}
                  </span>
                  <span
                    className={`text-xs font-semibold ${t.income - t.expense >= 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {formatCurrency(t.income - t.expense)}
                  </span>
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600">
                    ↑ {formatCurrency(t.income)}
                  </span>
                  <span className="text-red-500">
                    ↓ {formatCurrency(t.expense)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* Category breakdown */}
      {data.category_totals.length > 0 && (
        <Panel title="Category Breakdown">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <Th>Category</Th>
                <Th>Type</Th>
                <Th align="right">Total</Th>
                <Th align="right">Count</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.category_totals.map((cat, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {cat.category.replace(/_/g, " ")}
                  </td>
                  <td className="px-5 py-3">
                    <TypeBadge type={cat.type} />
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-gray-700">
                    {formatCurrency(cat.total)}
                  </td>
                  <td className="px-5 py-3 text-sm text-right text-gray-500">
                    {cat.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      )}
    </div>
  );
}

// ─── Small local components ────────────────────────────────────────────────────

function SummaryCard({
  icon,
  label,
  color,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl p-5">
      <div className={`flex items-center gap-2 mb-3 ${color}`}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-2xl font-semibold text-gray-900">{children}</p>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  return (
    <span
      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
        type === "INCOME"
          ? "bg-green-50 text-green-700"
          : "bg-red-50 text-red-600"
      }`}
    >
      {type}
    </span>
  );
}
