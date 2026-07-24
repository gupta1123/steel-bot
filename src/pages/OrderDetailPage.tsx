import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarBlank,
  ClockCounterClockwise,
  ListChecks,
  MapPin,
  Package,
  PencilSimple,
  UserCircle,
  X
} from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { LineItem, Order, StatusEvent } from "../types";

const statusTones: Record<string, string> = {
  "Order received": "received",
  Processing: "processing",
  Completed: "completed"
};

const statusOptions = ["Order received", "Processing", "Completed"];

function lineItemTitle(line: LineItem) {
  return [line.product_label || "Item", line.size, line.grade].filter(Boolean).join(" · ");
}

function lineItemQuantity(line: LineItem) {
  return line.quantity || [line.quantity_value, line.quantity_unit].filter(Boolean).join(" ") || "Quantity not recorded";
}

function eventDetails(event: StatusEvent) {
  return [
    event.updated_by_name && `Updated by ${event.updated_by_name}`,
    event.note && `${event.note_audience === "customer" ? "Customer note" : "Internal note"}: ${event.note}`,
    event.tracking_reference && `Tracking: ${event.tracking_reference}`,
    event.estimated_delivery && `Estimated delivery: ${event.estimated_delivery}`,
    !event.updated_by_name && !event.note && !event.tracking_reference && !event.estimated_delivery && event.source
  ].filter(Boolean).join(" · ");
}

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApiData<{ item: Order }>(`/orders/${encodeURIComponent(orderId)}`);
  const [showUpdate, setShowUpdate] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const item = data?.item;
  const currentStatus = item?.status_label || item?.status || "Unknown";

  const lineItems = useMemo<LineItem[]>(() => {
    if (!item?.draft) return [];
    if (item.draft.line_items?.length) return item.draft.line_items;
    return item.draft.product_label || item.draft.product_key ? [item.draft] : [];
  }, [item]);

  const statusHistory = useMemo<StatusEvent[]>(() => {
    if (!item) return [];
    if (item.status_history?.length) return [...item.status_history].reverse();
    return [{ label: currentStatus, at: item.updated_at || item.created_at, source: "Current stored status" }];
  }, [currentStatus, item]);

  useEffect(() => {
    if (!showUpdate) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setShowUpdate(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, showUpdate]);

  function openStatusUpdate() {
    setStatus(statusOptions.includes(currentStatus) ? currentStatus : "");
    setSubmitError("");
    setShowUpdate(true);
  }

  function closeStatusUpdate() {
    if (!busy) setShowUpdate(false);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setSubmitError("");
    try {
      await api(`/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        body: {
          status_label: status
        }
      });
      setShowUpdate(false);
      await reload();
    } catch (caught) {
      setSubmitError(caught instanceof ApiError ? caught.message : "Unable to update this status");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page detail-page order-detail-page">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && (
        <>
          <header className="order-detail-header">
            <button className="order-detail-back" type="button" onClick={() => navigate("/orders")} aria-label="Back to orders">
              <ArrowLeft size={21} weight="bold" />
            </button>
            <div>
              <h1>{item.order_id}</h1>
              <p>{item.customer_name || "Unknown customer"}{item.company_name ? ` · ${item.company_name}` : ""}</p>
            </div>
          </header>

          <div className="order-detail-workspace">
            <div className="order-detail-primary">
              <section className="order-dashboard-card">
                <div className="order-card-heading">
                  <span><ListChecks size={20} weight="bold" /></span>
                  <div>
                    <h2>Items ordered</h2>
                    <p>{lineItems.length} {lineItems.length === 1 ? "line item" : "line items"}</p>
                  </div>
                </div>
                {lineItems.length ? (
                  <div className="order-ledger-list">
                    {lineItems.map((line, index) => (
                      <div className="order-ledger-row" key={`${line.product_key || line.product_label || "item"}-${index}`}>
                        <span className="order-ledger-number">{index + 1}</span>
                        <span className="order-ledger-copy">
                          <strong>{lineItemTitle(line)}</strong>
                          <small>Quantity: {lineItemQuantity(line)}</small>
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No items recorded" message="This order does not have any stored line items." />
                )}
              </section>

              <section className="order-dashboard-card">
                <div className="order-card-heading">
                  <span><Package size={20} weight="bold" /></span>
                  <div>
                    <h2>Fulfillment &amp; delivery</h2>
                    <p>Stored customer and delivery details</p>
                  </div>
                </div>
                <div className="order-spec-grid">
                  <div className="order-spec-item">
                    <UserCircle size={19} />
                    <span><small>Customer</small><strong>{item.customer_name || "Unknown"}</strong></span>
                  </div>
                  <div className="order-spec-item">
                    <Package size={19} />
                    <span><small>Company</small><strong>{item.company_name || "Not specified"}</strong></span>
                  </div>
                  <div className="order-spec-item">
                    <MapPin size={19} />
                    <span><small>Delivery location</small><strong>{item.draft?.delivery_location || "Not specified"}</strong></span>
                  </div>
                  <div className="order-spec-item">
                    <CalendarBlank size={19} />
                    <span><small>Required by</small><strong>{item.draft?.required_by || "Not specified"}</strong></span>
                  </div>
                  <div className="order-spec-item">
                    <ClockCounterClockwise size={19} />
                    <span><small>Date created</small><strong>{formatDate(item.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</strong></span>
                  </div>
                  <div className="order-spec-item">
                    <UserCircle size={19} />
                    <span><small>Created by</small><strong>{item.created_by_name || item.customer_name || "Not recorded"}</strong></span>
                  </div>
                </div>
              </section>
            </div>

            <aside className="order-detail-side">
              <section className="order-action-card">
                <small>Current status</small>
                <span className={`order-status-badge ${statusTones[currentStatus] || "default"}`}>{currentStatus}</span>
                <button type="button" onClick={openStatusUpdate}>
                  <PencilSimple size={18} weight="bold" /> Update status
                </button>
              </section>

              <section className="order-timeline-card">
                <div className="order-card-heading compact">
                  <span><ClockCounterClockwise size={19} weight="bold" /></span>
                  <div><h2>Status history</h2><p>Latest update first</p></div>
                </div>
                <div className="order-status-timeline">
                  {statusHistory.map((event, index) => (
                    <div className={`order-timeline-event${index === 0 ? " latest" : ""}`} key={`${event.at || index}-${event.label}`}>
                      <i aria-hidden="true" />
                      <div>
                        <strong>{event.label}</strong>
                        <time>{formatDate(event.at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</time>
                        {eventDetails(event) && <small>{eventDetails(event)}</small>}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>

          {showUpdate && (
            <div className="status-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeStatusUpdate()}>
              <form className="status-modal" role="dialog" aria-modal="true" aria-labelledby="status-modal-title" onSubmit={submit}>
                <div className="status-modal-header">
                  <div>
                    <span className="eyebrow">Order workflow</span>
                    <h2 id="status-modal-title">Update order status</h2>
                  </div>
                  <button type="button" onClick={closeStatusUpdate} aria-label="Close status update" disabled={busy}><X size={20} /></button>
                </div>
                <div className="status-modal-body">
                  <label className="field">
                    <span>Order status</span>
                    <select value={status} onChange={(event) => setStatus(event.target.value)} required autoFocus>
                      <option value="" disabled>Select a status</option>
                      {statusOptions.map((value) => <option value={value} key={value}>{value}</option>)}
                    </select>
                  </label>
                  {submitError && <ErrorState message={submitError} />}
                </div>
                <div className="status-modal-actions">
                  <button className="button secondary" type="button" onClick={closeStatusUpdate} disabled={busy}>Cancel</button>
                  <button className="button primary" type="submit" disabled={busy || !status.trim()}>{busy ? "Updating…" : "Confirm update"}</button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
