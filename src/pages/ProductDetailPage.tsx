import { ArrowLeft, Stack } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { ErrorState, LoadingState } from "../components";
import { useApiData } from "../hooks";
import type { Product } from "../types";

function OptionChips({ values, quantity = false }: { values: string[]; quantity?: boolean }) {
  if (!values.length) return <span className="product-detail-empty-option">None configured</span>;

  return (
    <div className="product-detail-chips">
      {values.map((value, index) => (
        <span
          className={quantity ? "product-detail-quantity-chip" : "product-detail-chip"}
          key={`${value}-${index}`}
        >
          {value}
        </span>
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const { productKey = "" } = useParams();
  const { data, loading, error, reload } = useApiData<{ item: Product }>(
    `/products/${encodeURIComponent(productKey)}`
  );
  const navigate = useNavigate();
  const item = data?.item;

  return (
    <div className="page product-detail-page">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && (
        <>
          <header className="product-detail-header">
            <button
              type="button"
              onClick={() => navigate("/products")}
              aria-label="Back to products"
              title="Back to products"
            >
              <ArrowLeft size={18} weight="bold" />
            </button>
            <div>
              <h1>{item.label}</h1>
              <p>Product options shown by the WhatsApp assistant.</p>
            </div>
          </header>

          <div className="product-detail-workspace">
            <section className="product-options-card" aria-labelledby="selection-options-heading">
              <h2 id="selection-options-heading">
                <Stack size={19} weight="bold" />
                Selection Options
              </h2>

              <div className="product-option-section">
                <span>Sizes</span>
                <OptionChips values={item.sizes} />
              </div>

              <div className="product-option-section">
                <span>Grades</span>
                <OptionChips values={item.grades} />
              </div>

              <div className="product-option-section">
                <span>Units</span>
                <OptionChips values={item.units} />
              </div>

              <div className="product-option-section">
                <span>Quick Quantities</span>
                <OptionChips values={item.quantity_options} quantity />
              </div>
            </section>

            <aside className="product-spec-card" aria-label="Product specifications">
              <div className="product-spec-header">
                <span className={`product-detail-status ${item.active ? "active" : "inactive"}`}>
                  {item.active ? "Active" : "Inactive"}
                </span>
              </div>

              <dl className="product-spec-list">
                <div>
                  <dt>Reference Key</dt>
                  <dd><code>{item.product_key}</code></dd>
                </div>
                <div>
                  <dt>Also recognised as</dt>
                  <dd>{item.aliases.join(", ") || "No aliases configured"}</dd>
                </div>
              </dl>

              <button
                className="product-detail-edit"
                type="button"
                onClick={() => navigate(`/products/${encodeURIComponent(item.product_key)}/edit`)}
              >
                Edit Product
              </button>
            </aside>
          </div>
        </>
      )}
    </div>
  );
}
