import { CheckCircle, Database, Robot } from "@phosphor-icons/react";
import { DetailCard, DetailRow, ErrorState, LoadingState, PageHeader, StatusPill } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { AuditEvent } from "../types";

type Settings = {
  storage_backend: string;
  database_connected: boolean;
  whatsapp_sending_enabled: boolean;
  ai_model: string;
  audit_events: AuditEvent[];
};

export default function SettingsPage() {
  const { data, loading, error, reload } = useApiData<Settings>("/settings");
  return (
    <div className="page detail-page">
      <PageHeader title="Settings" description="Connection status and recent admin changes." />
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <div className="detail-layout settings-layout">
          <DetailCard title="System">
            <DetailRow label="Database"><span className="icon-value"><Database size={18} />{data.storage_backend === "postgres" ? "Supabase Postgres" : "Local JSON"}</span></DetailRow>
            <DetailRow label="Connection"><StatusPill active={data.database_connected} /></DetailRow>
            <DetailRow label="WhatsApp sending"><StatusPill active={data.whatsapp_sending_enabled} /></DetailRow>
            <DetailRow label="AI model"><span className="icon-value"><Robot size={18} />{data.ai_model}</span></DetailRow>
          </DetailCard>
          <DetailCard title="Recent changes">
            {data.audit_events.length === 0 ? (
              <div className="state-box small-state"><CheckCircle size={24} /><span>No admin changes yet.</span></div>
            ) : (
              <div className="simple-rows audit-list">
                {data.audit_events.map((event, index) => (
                  <div className="simple-row" key={`${event.created_at}-${index}`}>
                    <span className="primary-cell"><strong>{event.summary}</strong><small>{event.actor_username} · {event.entity_type}</small></span>
                    <span>{formatDate(event.created_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                  </div>
                ))}
              </div>
            )}
          </DetailCard>
        </div>
      )}
    </div>
  );
}
