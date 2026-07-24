import { ArrowLeft } from "@phosphor-icons/react";
import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { ErrorState, FormActions, LoadingState, SelectField, TextField, ToggleField } from "../components";
import { useApiData } from "../hooks";
import type { Product, ProductListItem } from "../types";

function splitValues(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function optionalNumber(value: string) {
  const cleaned = value.trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export default function ProductFormPage() {
  const { productKey } = useParams();
  const editing = Boolean(productKey);
  const detail = useApiData<{ item: Product }>(
    editing ? `/products/${encodeURIComponent(productKey || "")}` : null
  );
  const catalog = useApiData<{ items: ProductListItem[] }>(editing ? null : "/products");
  const [label, setLabel] = useState("");
  const [aliases, setAliases] = useState("");
  const [sizes, setSizes] = useState("");
  const [grades, setGrades] = useState("");
  const [units, setUnits] = useState("");
  const [quantities, setQuantities] = useState("");
  const [active, setActive] = useState(true);
  const [categoryKey, setCategoryKey] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [basePrice, setBasePrice] = useState("");
  const [initialStock, setInitialStock] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const returnTo = editing ? `/products/${encodeURIComponent(productKey || "")}` : "/products";
  const rootCategories = (catalog.data?.items || []).filter((item) => item.active && !item.category_key);
  const categoryOptions = rootCategories.length
    ? rootCategories
    : (catalog.data?.items || []).filter((item) => item.active);

  useEffect(() => {
    if (!editing || !detail.data?.item) return;
    const item = detail.data.item;
    setLabel(item.label);
    setAliases(item.aliases.join(", "));
    setSizes(item.sizes.join(", "));
    setGrades(item.grades.join(", "));
    setUnits(item.units.join(", "));
    setQuantities(item.quantity_options.join(", "));
    setActive(item.active);
  }, [detail.data, editing]);

  useEffect(() => {
    if (editing || categoryKey || !categoryOptions.length) return;
    setCategoryKey(categoryOptions[0].product_key);
  }, [categoryKey, categoryOptions, editing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const cleanLabel = label.trim();
    const cleanUnits = splitValues(units);
    const cleanBasePrice = optionalNumber(basePrice);
    const cleanInitialStock = optionalNumber(initialStock);

    if (!cleanLabel || (editing ? !cleanUnits.length : !categoryKey)) {
      setError(editing
        ? "Product name and at least one unit are required."
        : "Product name and category are required.");
      return;
    }
    if (!editing && ((basePrice.trim() && cleanBasePrice === null) || (initialStock.trim() && cleanInitialStock === null))) {
      setError("Price and stock must be zero or a positive number.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const body = editing
        ? {
            label: cleanLabel,
            aliases: splitValues(aliases),
            sizes: splitValues(sizes),
            grades: splitValues(grades),
            units: cleanUnits,
            quantity_options: splitValues(quantities),
            active
          }
        : {
            label: cleanLabel,
            category_key: categoryKey,
            manufacturer: manufacturer.trim() || null,
            base_price: cleanBasePrice,
            initial_stock_tons: cleanInitialStock,
            sizes: splitValues(sizes),
            grades: splitValues(grades),
            active: true
          };
      const result = await api<{ item: Product }>(
        editing ? `/products/${encodeURIComponent(productKey || "")}` : "/products",
        { method: editing ? "PATCH" : "POST", body }
      );
      navigate(`/products/${encodeURIComponent(result.item.product_key)}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save this product");
    } finally {
      setBusy(false);
    }
  }

  if (editing && detail.loading) return <div className="page product-form-page"><LoadingState /></div>;
  if (editing && detail.error) {
    return <div className="page product-form-page"><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  }

  if (!editing) {
    return (
      <div className="page product-form-page product-create-page">
        <header className="product-form-header">
          <button type="button" onClick={() => navigate(returnTo)} aria-label="Back" title="Back">
            <ArrowLeft size={18} weight="bold" />
          </button>
          <div><h1>Add New Product</h1></div>
        </header>

        <form className="product-form-card product-create-card" onSubmit={submit} noValidate>
          <section className="product-form-section" aria-labelledby="product-details-heading">
            <h2 id="product-details-heading">Product details</h2>
            <div className="product-form-grid">
              <TextField
                label="Product name"
                value={label}
                onChange={setLabel}
                required
                placeholder="e.g. TMT Bars 16mm"
              />
              <SelectField label="Category" value={categoryKey} onChange={setCategoryKey} disabled={catalog.loading}>
                {!categoryOptions.length && <option value="">Select category</option>}
                {categoryOptions.map((item) => (
                  <option key={item.product_key} value={item.product_key}>{item.label}</option>
                ))}
              </SelectField>
              <div className="product-form-wide-field">
                <TextField
                  label="Brand / manufacturer"
                  value={manufacturer}
                  onChange={setManufacturer}
                  placeholder="e.g. Icon Steel"
                />
              </div>
            </div>
            {catalog.error && <ErrorState message={catalog.error} onRetry={catalog.reload} />}
          </section>

          <div className="product-form-divider" />

          <section className="product-form-section" aria-labelledby="product-specifications-heading">
            <h2 id="product-specifications-heading">Specifications</h2>
            <div className="product-form-grid">
              <TextField label="Size / dimension" value={sizes} onChange={setSizes} placeholder="e.g. 16mm" />
              <TextField label="Grade" value={grades} onChange={setGrades} placeholder="e.g. Fe 550D" />
            </div>
          </section>

          <div className="product-form-divider" />

          <section className="product-form-section" aria-labelledby="product-inventory-heading">
            <h2 id="product-inventory-heading">Pricing &amp; Inventory</h2>
            <div className="product-form-grid">
              <TextField label="Base price (₹)" value={basePrice} onChange={setBasePrice} type="number" placeholder="e.g. 56000" />
              <TextField label="Initial stock (tons)" value={initialStock} onChange={setInitialStock} type="number" placeholder="e.g. 50" />
            </div>
          </section>

          {error && <ErrorState message={error} />}
          <FormActions onCancel={() => navigate(returnTo)} busy={busy} submitLabel="Save Product" />
        </form>
      </div>
    );
  }

  return (
    <div className="page product-form-page">
      <header className="product-form-header">
        <button type="button" onClick={() => navigate(returnTo)} aria-label="Back" title="Back">
          <ArrowLeft size={18} weight="bold" />
        </button>
        <div>
          <h1>Edit product</h1>
          <p>These options update the WhatsApp product menus immediately.</p>
        </div>
      </header>

      <form className="product-form-card" onSubmit={submit} noValidate>
        <section className="product-form-section" aria-labelledby="product-general-heading">
          <h2 id="product-general-heading">General details</h2>
          <div className="product-form-grid">
            <TextField
              label="Product name"
              value={label}
              onChange={setLabel}
              required
              placeholder="Product name"
            />
            <TextField
              label="Aliases"
              value={aliases}
              onChange={setAliases}
              placeholder="angle, channel, beam"
            />
          </div>
        </section>

        <div className="product-form-divider" />

        <section className="product-form-section" aria-labelledby="product-selection-heading">
          <h2 id="product-selection-heading">Selection parameters</h2>
          <div className="product-form-grid">
            <TextField label="Sizes" value={sizes} onChange={setSizes} placeholder="e.g. 25×25, 40×40" />
            <TextField label="Grades" value={grades} onChange={setGrades} placeholder="e.g. E250, E350" />
            <TextField label="Units" value={units} onChange={setUnits} required placeholder="e.g. kg, pieces" />
            <TextField
              label="Quick quantities"
              value={quantities}
              onChange={setQuantities}
              placeholder="e.g. 1, 2, 5"
            />
            <p className="product-form-help">
              Separate multiple options with commas. Customers can still type a custom quantity.
            </p>
          </div>
        </section>

        <div className="product-form-divider" />

        <section className="product-form-section">
          <ToggleField
            label="Available in WhatsApp"
            description="Inactive products remain in history but disappear from new order menus."
            checked={active}
            onChange={setActive}
          />
        </section>

        {error && <ErrorState message={error} />}
        <FormActions
          onCancel={() => navigate(returnTo)}
          busy={busy}
          submitLabel="Save changes"
        />
      </form>
    </div>
  );
}
