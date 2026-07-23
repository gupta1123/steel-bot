import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { ErrorState, FormActions, LoadingState, PageHeader, TextField, ToggleField } from "../components";
import { useApiData } from "../hooks";
import type { Product } from "../types";

function splitValues(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function ProductFormPage() {
  const { productKey } = useParams();
  const editing = Boolean(productKey);
  const detail = useApiData<{ item: Product }>(editing ? `/products/${encodeURIComponent(productKey || "")}` : null);
  const [label, setLabel] = useState("");
  const [aliases, setAliases] = useState("");
  const [sizes, setSizes] = useState("");
  const [grades, setGrades] = useState("");
  const [units, setUnits] = useState("");
  const [quantities, setQuantities] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!editing || !detail.data?.item) return;
    const item = detail.data.item;
    setLabel(item.label); setAliases(item.aliases.join(", ")); setSizes(item.sizes.join(", "));
    setGrades(item.grades.join(", ")); setUnits(item.units.join(", "));
    setQuantities(item.quantity_options.join(", ")); setActive(item.active);
  }, [detail.data, editing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = await api<{ item: Product }>(editing ? `/products/${productKey}` : "/products", {
        method: editing ? "PATCH" : "POST",
        body: {
          label,
          aliases: splitValues(aliases), sizes: splitValues(sizes), grades: splitValues(grades),
          units: splitValues(units), quantity_options: splitValues(quantities), active
        }
      });
      navigate(`/products/${result.item.product_key}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save this product");
    } finally { setBusy(false); }
  }

  if (editing && detail.loading) return <div className="page"><LoadingState /></div>;
  if (editing && detail.error) return <div className="page"><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  return (
    <div className="page detail-page">
      <PageHeader title={editing ? "Edit product" : "Add product"} description="These options update the WhatsApp product menus immediately." backTo={editing ? `/products/${productKey}` : "/products"} />
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <TextField label="Product name" value={label} onChange={setLabel} required placeholder="TMT Bars" />
          <TextField label="Aliases" value={aliases} onChange={setAliases} placeholder="tmt, rebar, sariya" />
          <TextField label="Sizes" value={sizes} onChange={setSizes} placeholder="8mm, 10mm, 12mm" />
          <TextField label="Grades" value={grades} onChange={setGrades} placeholder="Fe 500, Fe 500D" />
          <TextField label="Units" value={units} onChange={setUnits} required placeholder="kg, metric ton, pieces" />
          <TextField label="Quick quantities" value={quantities} onChange={setQuantities} placeholder="1, 2, 5, 10, 20" />
        </div>
        <p className="field-help">Separate multiple options with commas. Customers can still type a custom quantity.</p>
        <ToggleField label="Available in WhatsApp" description="Inactive products remain in history but disappear from new order menus." checked={active} onChange={setActive} />
        {error && <ErrorState message={error} />}
        <FormActions onCancel={() => navigate(-1)} busy={busy} submitLabel={editing ? "Save changes" : "Add product"} />
      </form>
    </div>
  );
}
