import { FormEvent, useMemo, useState } from "react";
import { PencilSimple } from "@phosphor-icons/react";
import { useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { DetailCard, DetailRow, ErrorState, FormActions, LoadingState, PageHeader, SecondaryButton, StatusPill, TextField } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { Order } from "../types";

export default function OrderDetailPage() {
  const { orderId = "" } = useParams();
  const { data, loading, error, reload } = useApiData<{ item: Order }>(`/orders/${encodeURIComponent(orderId)}`);
  const [showUpdate, setShowUpdate] = useState(false);
  const [status, setStatus] = useState("");
  const [note, setNote] = useState("");
  const [tracking, setTracking] = useState("");
  const [estimate, setEstimate] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const item = data?.item;
  const lineItems = useMemo(() => item?.draft?.line_items || [], [item]);

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setSubmitError("");
    try {
      await api(`/orders/${encodeURIComponent(orderId)}/status`, {
        method: "POST",
        body: { status_label: status, note: note || null, tracking_reference: tracking || null, estimated_delivery: estimate || null }
      });
      setShowUpdate(false); setStatus(""); setNote(""); setTracking(""); setEstimate("");
      await reload();
    } catch (caught) {
      setSubmitError(caught instanceof ApiError ? caught.message : "Unable to update this status");
    } finally { setBusy(false); }
  }

  return (
    <div className="page detail-page">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && (
        <>
          <PageHeader
            title={item.order_id}
            description={`${item.customer_name || "Unknown customer"}${item.company_name ? ` · ${item.company_name}` : ""}`}
            backTo="/orders"
            action={<SecondaryButton onClick={() => { setStatus(item.status_label || item.status || ""); setShowUpdate(true); }}><PencilSimple size={18} /> Update status</SecondaryButton>}
          />
          {showUpdate && (
            <form className="form-card inline-form" onSubmit={submit}>
              <h2>Update order status</h2>
              <div className="form-grid">
                <TextField label="Current status" value={status} onChange={setStatus} required placeholder="Loaded for dispatch" />
                <TextField label="Note" value={note} onChange={setNote} placeholder="Optional factual note" />
                <TextField label="Tracking reference" value={tracking} onChange={setTracking} placeholder="Optional" />
                <TextField label="Estimated delivery" value={estimate} onChange={setEstimate} placeholder="Optional" />
              </div>
              {submitError && <ErrorState message={submitError} />}
              <FormActions onCancel={() => setShowUpdate(false)} busy={busy} submitLabel="Save status" />
            </form>
          )}
          <div className="detail-layout order-detail-layout">
            <DetailCard title="Order details">
              <DetailRow label="Status"><StatusPill label={item.status_label || item.status || "Unknown"} /></DetailRow>
              <DetailRow label="Customer">{item.customer_name || "Unknown"}</DetailRow>
              <DetailRow label="Delivery">{item.draft?.delivery_location || "Not specified"}</DetailRow>
              <DetailRow label="Required by">{item.draft?.required_by || "Not specified"}</DetailRow>
              <DetailRow label="Created">{formatDate(item.created_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</DetailRow>
            </DetailCard>
            <DetailCard title="Items">
              <div className="simple-rows">
                {(lineItems.length ? lineItems : [item.draft || {}]).map((line, index) => (
                  <div className="simple-row item-row" key={`${line.product_key || "item"}-${index}`}>
                    <span className="item-number">{index + 1}</span>
                    <span className="primary-cell"><strong>{line.product_label || "Item"} {line.size || ""}</strong><small>{line.quantity || [line.quantity_value, line.quantity_unit].filter(Boolean).join(" ") || "Quantity not recorded"}</small></span>
                  </div>
                ))}
              </div>
            </DetailCard>
            <DetailCard title="Status history">
              <div className="timeline">
                {[...(item.status_history || [])].reverse().map((event, index) => (
                  <div className="timeline-event" key={`${event.at || index}-${event.label}`}>
                    <i aria-hidden="true" />
                    <span className="primary-cell"><strong>{event.label}</strong><small>{[event.note, event.tracking_reference && `Ref: ${event.tracking_reference}`, event.estimated_delivery && `ETA: ${event.estimated_delivery}`].filter(Boolean).join(" · ") || event.source || "Status update"}</small></span>
                    <span>{formatDate(event.at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            </DetailCard>
          </div>
        </>
      )}
    </div>
  );
}
