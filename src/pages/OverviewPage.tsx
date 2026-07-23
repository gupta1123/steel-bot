import { Cube, Package, UsersThree } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";
import { ErrorState, LoadingState, PageHeader, RowLink, StatusPill } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { OrderListItem } from "../types";

type Overview = {
  counts: { customers: number; employees: number; products: number; orders: number };
  recent_orders: OrderListItem[];
};

export default function OverviewPage() {
  const { data, loading, error, reload } = useApiData<Overview>("/overview");
  const navigate = useNavigate();
  return (
    <div className="page">
      <PageHeader title="Overview" description="A quick view of what needs your attention." />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <>
          <section className="summary-grid" aria-label="Business summary">
            <button type="button" onClick={() => navigate("/customers")}>
              <span className="summary-icon"><UsersThree size={22} /></span>
              <span><small>Customers</small><strong>{data.counts.customers}</strong></span>
            </button>
            <button type="button" onClick={() => navigate("/orders")}>
              <span className="summary-icon"><Package size={22} /></span>
              <span><small>Orders</small><strong>{data.counts.orders}</strong></span>
            </button>
            <button type="button" onClick={() => navigate("/products")}>
              <span className="summary-icon"><Cube size={22} /></span>
              <span><small>Products</small><strong>{data.counts.products}</strong></span>
            </button>
          </section>
          <section className="list-section">
            <div className="section-heading">
              <div><h2>Recent orders</h2><p>The five latest order updates.</p></div>
              <button type="button" onClick={() => navigate("/orders")}>View all</button>
            </div>
            <div className="data-list compact-list">
              <div className="list-head order-grid">
                <span>Order</span><span>Customer</span><span>Status</span><span>Updated</span><span />
              </div>
              {data.recent_orders.map((order) => (
                <div className="list-row order-grid" key={order.order_id}>
                  <div className="primary-cell"><strong>{order.order_id}</strong><small>{order.item_summary}</small></div>
                  <span>{order.customer_name || "Unknown"}</span>
                  <StatusPill label={order.status_label} />
                  <span>{formatDate(order.updated_at)}</span>
                  <RowLink to={`/orders/${encodeURIComponent(order.order_id)}`} label={`Open ${order.order_id}`} />
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
