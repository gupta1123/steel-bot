import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState, LoadingState, PageHeader, PrimaryButton, RowLink, SearchBox, StatusPill } from "../components";
import { useApiData } from "../hooks";
import type { ProductListItem } from "../types";

export default function ProductsListPage() {
  const { data, loading, error, reload } = useApiData<{ items: ProductListItem[] }>("/products");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const navigate = useNavigate();
  const items = useMemo(() => (data?.items || []).filter((item) => {
    const matchesQuery = `${item.label} ${item.sizes.join(" ")} ${item.units.join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
    const matchesStatus = status === "all" || (status === "active" ? item.active : !item.active);
    return matchesQuery && matchesStatus;
  }), [data, query, status]);
  return (
    <div className="page">
      <PageHeader
        title="Products"
        description="Control what customers can select in WhatsApp."
        action={<PrimaryButton onClick={() => navigate("/products/new")}>Add product</PrimaryButton>}
      />
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder="Search products by name, size or unit" />
        <label className="select-filter">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Status: All</option><option value="active">Active</option><option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <section className="list-section no-top-margin">
          <div className="list-meta">{items.length} products</div>
          <div className="data-list">
            <div className="list-head product-grid"><span>Product</span><span>Sizes</span><span>Orders</span><span>Status</span><span /></div>
            {items.map((item) => (
              <div className="list-row product-grid" key={item.product_key}>
                <div className="primary-cell"><strong>{item.label}</strong><small>{item.units.slice(0, 3).join(" · ") || "No units configured"}</small></div>
                <span>{item.sizes.length} options</span>
                <span>{item.order_count}</span>
                <StatusPill active={item.active} />
                <RowLink to={`/products/${encodeURIComponent(item.product_key)}`} label={`Open ${item.label}`} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
