import { FormEvent, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { ErrorState, FormActions, LoadingState, PageHeader, SelectField, TextField, ToggleField } from "../components";
import { useApiData } from "../hooks";
import type { Identity, Role } from "../types";

type DetailResponse = { item: Identity };

export default function PersonFormPage({ role }: { role: Role }) {
  const { phone } = useParams();
  const editing = Boolean(phone);
  const plural = role === "customer" ? "customers" : "employees";
  const detail = useApiData<DetailResponse>(editing ? `/${plural}/${encodeURIComponent(phone || "")}` : null);
  const employees = useApiData<{ items: Identity[] }>("/employees");
  const [name, setName] = useState("");
  const [phoneValue, setPhoneValue] = useState("");
  const [company, setCompany] = useState("");
  const [nextRole, setNextRole] = useState<Role>(role);
  const [assignedEmployee, setAssignedEmployee] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!editing || !detail.data?.item) return;
    const item = detail.data.item;
    setName(item.name);
    setPhoneValue(item.phone);
    setCompany(item.company_name || "");
    setNextRole(item.role);
    setAssignedEmployee(item.assigned_employee_id || "");
    setActive(item.active);
  }, [detail.data, editing]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = {
      ...(!editing ? { phone: phoneValue } : {}),
      name,
      company_name: company || null,
      role: nextRole,
      assigned_employee_id: nextRole === "customer" ? assignedEmployee || null : null,
      active
    };
    try {
      const result = await api<{ item: Identity }>(editing ? `/${plural}/${phone}` : `/${plural}`, {
        method: editing ? "PATCH" : "POST",
        body
      });
      const destination = result.item.role === "customer" ? "customers" : "employees";
      navigate(`/${destination}/${result.item.phone}`, { replace: true });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save this person");
    } finally {
      setBusy(false);
    }
  }

  if (editing && detail.loading) return <div className="page"><LoadingState /></div>;
  if (editing && detail.error) return <div className="page"><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  return (
    <div className="page detail-page">
      <PageHeader
        title={editing ? `Edit ${role === "customer" ? "customer" : "employee"}` : `Add ${role === "customer" ? "customer" : "employee"}`}
        description="Keep only the details the bot needs to identify and support this person."
        backTo={`/${plural}${editing ? `/${phone}` : ""}`}
      />
      <form className="form-card" onSubmit={submit}>
        <div className="form-grid">
          <TextField label="Name" value={name} onChange={setName} required placeholder="Full name" />
          <TextField label="Phone with country code" value={phoneValue} onChange={setPhoneValue} required disabled={editing} placeholder="917019339764" />
          <TextField label="Company" value={company} onChange={setCompany} placeholder="Optional" />
          <SelectField label="Role" value={nextRole} onChange={(value) => setNextRole(value as Role)}>
            <option value="customer">Customer</option>
            <option value="internal_employee">Employee</option>
          </SelectField>
          {nextRole === "customer" && (
            <SelectField label="Assigned employee" value={assignedEmployee} onChange={setAssignedEmployee}>
              <option value="">Unassigned</option>
              {(employees.data?.items || []).filter((item) => item.active).map((employee) => (
                <option key={employee.identity_id} value={employee.identity_id}>{employee.name}</option>
              ))}
            </SelectField>
          )}
        </div>
        <ToggleField
          label="Active"
          description="Inactive people stay in records but are unavailable to the bot."
          checked={active}
          onChange={setActive}
        />
        {error && <ErrorState message={error} />}
        <FormActions onCancel={() => navigate(-1)} busy={busy} submitLabel={editing ? "Save changes" : "Add person"} />
      </form>
    </div>
  );
}
