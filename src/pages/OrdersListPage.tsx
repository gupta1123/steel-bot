import { useMemo, useState } from "react";
import { ErrorState, LoadingState, PageHeader, RowLink, SearchBox, StatusPill } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { OrderListItem } from "../types";

export default function OrdersListPage() {
  const { data, loading, error, reload } = useApiData<{ items: OrderListItem[] }>("/orders");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const statuses = useMemo(() => Array.from(new Set((data?.items || []).map((item) => item.status_label))).sort(), [data]);
  const items = useMemo(() => (data?.items || []).filter((item) => {
    const text = `${item.order_id} ${item.customer_name || ""} ${item.item_summary} ${item.delivery_location || ""}`.toLocaleLowerCase();
    return text.includes(query.trim().toLocaleLowerCase()) && (status === "all" || item.status_label === status);
  }), [data, query, status]);
  return (
    <div className="page">
      <PageHeader title="Orders" description="Live orders and their latest stored status." />
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search by order, customer or product" />
        <label className="select-filter">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Status: All</option>
            {statuses.map((value) => <option value={value} key={value}>{value}</option>)}
          </select>
        </label>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <section className="list-section no-top-margin">
          <div className="list-meta">{items.length} orders</div>
          <div className="data-list">
            <div className="list-head order-grid"><span>Order</span><span>Customer</span><span>Status</span><span>Updated</span><span /></div>
            {items.map((item) => (
              <div className="list-row order-grid" key={item.order_id}>
                <div className="primary-cell"><strong>{item.order_id}</strong><small>{item.item_summary}</small></div>
                <div className="primary-cell"><strong>{item.customer_name || "Unknown"}</strong><small>{item.company_name || item.delivery_location || "No company"}</small></div>
                <StatusPill label={item.status_label} />
                <span>{formatDate(item.updated_at)}</span>
                <RowLink to={`/orders/${encodeURIComponent(item.order_id)}`} label={`Open ${item.order_id}`} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
