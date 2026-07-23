import { PencilSimple } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { DetailCard, DetailRow, ErrorState, LoadingState, PageHeader, SecondaryButton, StatusPill } from "../components";
import { useApiData } from "../hooks";
import type { Product } from "../types";

function Chips({ values }: { values: string[] }) {
  if (!values.length) return <span className="muted-text">None added</span>;
  return <div className="chips">{values.map((value) => <span key={value}>{value}</span>)}</div>;
}

export default function ProductDetailPage() {
  const { productKey = "" } = useParams();
  const { data, loading, error, reload } = useApiData<{ item: Product }>(`/products/${encodeURIComponent(productKey)}`);
  const navigate = useNavigate();
  const item = data?.item;
  return (
    <div className="page detail-page">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && (
        <>
          <PageHeader
            title={item.label}
            description="Product options shown by the WhatsApp assistant."
            backTo="/products"
            action={<SecondaryButton onClick={() => navigate(`/products/${item.product_key}/edit`)}><PencilSimple size={18} /> Edit</SecondaryButton>}
          />
          <div className="detail-layout">
            <DetailCard title="Product">
              <DetailRow label="Status"><StatusPill active={item.active} /></DetailRow>
              <DetailRow label="Reference key">{item.product_key}</DetailRow>
              <DetailRow label="Also recognised as">{item.aliases.join(", ") || "No aliases"}</DetailRow>
            </DetailCard>
            <DetailCard title="Selection options">
              <div className="option-group"><span>Sizes</span><Chips values={item.sizes} /></div>
              <div className="option-group"><span>Grades</span><Chips values={item.grades} /></div>
              <div className="option-group"><span>Units</span><Chips values={item.units} /></div>
              <div className="option-group"><span>Quick quantities</span><Chips values={item.quantity_options} /></div>
            </DetailCard>
          </div>
        </>
      )}
    </div>
  );
}
