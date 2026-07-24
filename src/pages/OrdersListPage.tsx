import { CaretRight, Check, Copy } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeader, SearchBox } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { OrderListItem } from "../types";

const statusTones: Record<string, string> = {
  "Order received": "received",
  Processing: "processing",
  Completed: "completed"
};

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

export default function OrdersListPage() {
  const { data, loading, error, reload } = useApiData<{ items: OrderListItem[] }>("/orders");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [copiedOrderId, setCopiedOrderId] = useState("");
  const navigate = useNavigate();
  const statuses = useMemo(() => Array.from(new Set((data?.items || []).map((item) => item.status_label))).sort(), [data]);
  const items = useMemo(() => (data?.items || []).filter((item) => {
    const text = `${item.order_id} ${item.customer_name || ""} ${item.company_name || ""} ${item.item_summary} ${item.delivery_location || ""}`.toLocaleLowerCase();
    return text.includes(query.trim().toLocaleLowerCase()) && (status === "all" || item.status_label === status);
  }), [data, query, status]);

  async function copyOrderId(orderId: string) {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(orderId);
      window.setTimeout(() => setCopiedOrderId((current) => current === orderId ? "" : current), 1800);
    } catch {
      setCopiedOrderId("");
    }
  }

  return (
    <div className="page orders-page">
      <PageHeader title="Orders" description="Live orders and their latest stored status." />
      <div className="order-control-strip">
        <div className="order-search">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by order, customer or product..." />
        </div>
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
        <section className="order-list-section">
          <div className="order-list-meta">{items.length} {items.length === 1 ? "order" : "orders"}</div>
          <span className="sr-only" aria-live="polite">{copiedOrderId ? `${copiedOrderId} copied` : ""}</span>
          <div className="order-table-card">
            {items.length === 0 ? (
              <EmptyState title="No matching orders" message="Try a different search or status filter." />
            ) : (
              <div className="order-table-scroll">
                <table className="order-data-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.order_id}>
                        <td>
                          <div className="order-cell">
                            <div className="order-id-line">
                              <strong>{item.order_id}</strong>
                              <button
                                className={`order-copy-button${copiedOrderId === item.order_id ? " copied" : ""}`}
                                type="button"
                                onClick={() => void copyOrderId(item.order_id)}
                                aria-label={`Copy ${item.order_id}`}
                                title={copiedOrderId === item.order_id ? "Copied" : "Copy order ID"}
                              >
                                {copiedOrderId === item.order_id ? <Check size={14} weight="bold" /> : <Copy size={14} />}
                              </button>
                            </div>
                            <small>{item.item_summary}</small>
                          </div>
                        </td>
                        <td>
                          <div className="order-customer-cell">
                            <span className="order-avatar">{initials(item.customer_name)}</span>
                            <span>
                              <strong>{item.customer_name || "Unknown"}</strong>
                              <small>{item.company_name || item.delivery_location || "No company"}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`order-status-badge ${statusTones[item.status_label] || "default"}`}>
                            {item.status_label}
                          </span>
                        </td>
                        <td><span className="order-updated-date">{formatDate(item.updated_at)}</span></td>
                        <td>
                          <button
                            className="order-open-button"
                            type="button"
                            onClick={() => navigate(`/orders/${encodeURIComponent(item.order_id)}`)}
                            aria-label={`Open ${item.order_id}`}
                          >
                            <CaretRight size={19} weight="bold" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
