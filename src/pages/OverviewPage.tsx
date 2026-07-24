import { ArrowsClockwise, Package, Tag, UsersThree } from "@phosphor-icons/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeader } from "../components";
import { useApiData } from "../hooks";

type Period = "30d" | "90d" | "365d" | "all";

type AnalyticsItem = {
  label: string;
  count?: number;
  order_count?: number;
  percentage: number;
};

type Overview = {
  period: { key: Period; label: string };
  summary: {
    orders: number;
    ordering_customers: number;
    products_ordered: number;
    repeat_customers: number;
  };
  status_breakdown: AnalyticsItem[];
  product_demand: AnalyticsItem[];
  monthly_orders: { key: string; label: string; count: number }[];
  customer_analysis: {
    total_active: number;
    repeat: number;
    one_time: number;
    without_orders: number;
    assigned: number;
    unassigned: number;
  };
};

function AnalyticsBars({ items, valueKey }: { items: AnalyticsItem[]; valueKey: "count" | "order_count" }) {
  if (items.length === 0) {
    return <EmptyState title="No data in this period" message="Choose a wider date range to see the breakdown." />;
  }
  return (
    <div className="analytics-bars">
      {items.map((item) => (
        <div className="analytics-bar-row" key={item.label}>
          <div className="analytics-bar-label">
            <strong>{item.label}</strong>
            <span>
              {item[valueKey] || 0}
              {valueKey === "order_count" ? ` ${(item[valueKey] || 0) === 1 ? "order" : "orders"}` : ""}
            </span>
          </div>
          <div className="analytics-track" aria-label={`${item.label}: ${item.percentage}%`}>
            <span style={{ width: `${Math.max(item.percentage, 3)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const { data, loading, error, reload } = useApiData<Overview>(`/overview?window=${period}`);
  const navigate = useNavigate();
  const maximumMonthlyOrders = Math.max(...(data?.monthly_orders.map((item) => item.count) || [0]), 1);

  return (
    <div className="page overview-page">
      <PageHeader
        title="Overview"
        description="Performance across orders, products and customer activity."
        action={(
          <label className="period-control">
            <span className="sr-only">Analysis period</span>
            <select value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="365d">Last 12 months</option>
              <option value="all">All time</option>
            </select>
          </label>
        )}
      />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <section className="metric-grid" aria-label="Performance summary">
            <button type="button" onClick={() => navigate("/orders")}>
              <span className="metric-icon"><Package size={21} /></span>
              <span className="metric-copy"><small>Orders</small><strong>{data.summary.orders}</strong><em>{data.period.label}</em></span>
            </button>
            <button type="button" onClick={() => navigate("/customers")}>
              <span className="metric-icon"><UsersThree size={21} /></span>
              <span className="metric-copy"><small>Ordering customers</small><strong>{data.summary.ordering_customers}</strong><em>{data.period.label}</em></span>
            </button>
            <button type="button" onClick={() => navigate("/products")}>
              <span className="metric-icon"><Tag size={21} /></span>
              <span className="metric-copy"><small>Products ordered</small><strong>{data.summary.products_ordered}</strong><em>{data.period.label}</em></span>
            </button>
            <button type="button" onClick={() => navigate("/customers")}>
              <span className="metric-icon"><ArrowsClockwise size={21} /></span>
              <span className="metric-copy"><small>Repeat customers</small><strong>{data.summary.repeat_customers}</strong><em>More than one order</em></span>
            </button>
          </section>

          <div className="analytics-layout">
            <section className="analytics-card status-analysis">
              <div className="analytics-heading">
                <div><h2>Order status</h2><p>Where orders currently sit in the workflow.</p></div>
                <span>{data.summary.orders} total</span>
              </div>
              <AnalyticsBars items={data.status_breakdown} valueKey="count" />
            </section>

            <section className="analytics-card customer-analysis">
              <div className="analytics-heading">
                <div><h2>Customer activity</h2><p>How active customers are engaging.</p></div>
                <span>{data.customer_analysis.total_active} active</span>
              </div>
              <div className="customer-stat-list">
                <div><span>Repeat customers</span><strong>{data.customer_analysis.repeat}</strong></div>
                <div><span>One-time customers</span><strong>{data.customer_analysis.one_time}</strong></div>
                <div><span>No orders in period</span><strong>{data.customer_analysis.without_orders}</strong></div>
              </div>
              <div className="coverage-note">
                <span>Employee coverage</span>
                <strong>{data.customer_analysis.assigned} assigned · {data.customer_analysis.unassigned} unassigned</strong>
              </div>
            </section>

            <section className="analytics-card volume-analysis">
              <div className="analytics-heading">
                <div><h2>Order volume</h2><p>Monthly orders within the selected period.</p></div>
              </div>
              <div className="volume-chart" aria-label="Monthly order volume">
                {data.monthly_orders.length === 0
                  ? <EmptyState title="No orders in this period" message="Order volume will appear here once orders are placed." />
                  : data.monthly_orders.map((item) => (
                    <div className="volume-column" key={item.key} aria-label={`${item.label}: ${item.count} orders`}>
                      <strong>{item.label}: {item.count} {item.count === 1 ? "order" : "orders"}</strong>
                      <div><span style={{ height: `${Math.max((item.count / maximumMonthlyOrders) * 100, item.count ? 8 : 2)}%` }} /></div>
                      <small>{item.label}</small>
                    </div>
                  ))}
              </div>
            </section>

            <section className="analytics-card product-analysis">
              <div className="analytics-heading">
                <div><h2>Product demand</h2><p>Products appearing across the most orders.</p></div>
              </div>
              <AnalyticsBars items={data.product_demand} valueKey="order_count" />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
