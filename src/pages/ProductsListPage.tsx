import { CaretRight, Cube } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeader, PrimaryButton, SearchBox } from "../components";
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
    <div className="page products-page">
      <PageHeader
        title="Products"
        description="Control what customers can select in WhatsApp."
        action={<PrimaryButton onClick={() => navigate("/products/new")}>Add Product</PrimaryButton>}
      />
      <div className="product-control-strip">
        <div className="product-search">
          <SearchBox value={query} onChange={setQuery} placeholder="Search by name, size or unit..." />
        </div>
        <label className="select-filter">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && (
        <section className="product-list-section">
          <div className="product-list-meta">{items.length} {items.length === 1 ? "product" : "products"}</div>
          <div className="product-table-card">
            {items.length === 0 ? (
              <EmptyState title="No matching products" message="Try a different search or status filter." />
            ) : (
              <div className="product-table-scroll">
                <table className="product-data-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Sizes</th>
                      <th>Orders</th>
                      <th>Status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.product_key}>
                        <td>
                          <div className="product-identity-cell">
                            <span className="product-icon" aria-hidden="true"><Cube size={17} weight="regular" /></span>
                            <span className="product-details">
                              <strong>{item.label}</strong>
                              <span className="product-units">
                                {item.units.length > 0
                                  ? item.units.slice(0, 3).map((unit) => <span className="product-unit-chip" key={unit}>{unit}</span>)
                                  : <span className="product-unit-chip">No units configured</span>}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td><span className="product-option-badge">{item.sizes.length} {item.sizes.length === 1 ? "option" : "options"}</span></td>
                        <td><strong className="product-order-count">{item.order_count}</strong></td>
                        <td><span className={`product-status-badge ${item.active ? "active" : "inactive"}`}>{item.active ? "Active" : "Inactive"}</span></td>
                        <td>
                          <button
                            className="product-open-button"
                            type="button"
                            onClick={() => navigate(`/products/${encodeURIComponent(item.product_key)}`)}
                            aria-label={`Open ${item.label}`}
                            title="View product details"
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
