import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { ErrorState, FormActions, LoadingState, SelectField, TextField, ToggleField } from "../components";
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
  const backPath = `/${plural}${editing ? `/${phone}` : ""}`;
  const employeeForm = role === "internal_employee";
  const addingEmployee = employeeForm && !editing;

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
      navigate(`/${destination}/${result.item.phone}`, {
        replace: true,
        state: {
          profileNotice: editing
            ? "Changes saved successfully"
            : `${result.item.role === "customer" ? "Customer" : "Employee"} added successfully`
        }
      });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "Unable to save this person");
    } finally {
      setBusy(false);
    }
  }

  if (editing && detail.loading) return <div className="page"><LoadingState /></div>;
  if (editing && detail.error) return <div className="page"><ErrorState message={detail.error} onRetry={detail.reload} /></div>;
  return (
    <div className="page person-form-page">
      <header className="person-form-header">
        <button type="button" onClick={() => navigate(backPath)} aria-label={`Back to ${editing ? "profile" : plural}`}>
          <ArrowLeft size={20} weight="bold" />
        </button>
        <div>
          <h1>{editing ? `Edit ${role === "customer" ? "customer" : "employee"}` : `Add ${role === "customer" ? "customer" : "employee"}`}</h1>
          <p>Keep only the details the bot needs to identify and support this person.</p>
        </div>
      </header>

      <form className="person-form-card" onSubmit={submit}>
        <section className="person-form-section">
          <h2>Contact Identity</h2>
          <div className="person-form-grid">
            <TextField label="Full name" value={name} onChange={setName} required placeholder="Full name" />
            <TextField label="Phone with country code" value={phoneValue} onChange={setPhoneValue} required disabled={editing} placeholder="For example, 919876543210" />
          </div>
        </section>

        <div className="person-form-divider" />

        <section className="person-form-section">
          <h2>{employeeForm ? "Role & Organization" : "Relationship & Routing"}</h2>
          <div className="person-form-grid">
            <TextField label="Company" value={company} onChange={setCompany} placeholder="Optional" />
            {addingEmployee ? (
              <SelectField label="Role" value="internal_employee" onChange={() => undefined}>
                <option value="internal_employee">Employee</option>
              </SelectField>
            ) : (
              <SelectField label="Role" value={nextRole} onChange={(value) => setNextRole(value as Role)}>
                <option value="customer">Customer</option>
                <option value="internal_employee">Employee</option>
              </SelectField>
            )}
            {nextRole === "customer" && (
              <div className="person-form-wide-field">
                <SelectField label="Assigned employee" value={assignedEmployee} onChange={setAssignedEmployee}>
                  <option value="">Unassigned</option>
                  {(employees.data?.items || [])
                    .filter((item) => item.active || item.identity_id === assignedEmployee)
                    .map((employee) => (
                      <option key={employee.identity_id} value={employee.identity_id}>{employee.name}{employee.active ? "" : " (inactive)"}</option>
                    ))}
                </SelectField>
              </div>
            )}
          </div>
          {nextRole === "customer" && employees.error && (
            <p className="person-form-help error-text">Employee assignments could not be loaded. You can leave this customer unassigned and try again later.</p>
          )}
        </section>

        <div className="person-form-divider" />

        <section className="person-form-section">
          <ToggleField
            label="Active status"
            description="Inactive people stay in records but are unavailable to the bot."
            checked={active}
            onChange={setActive}
          />
        </section>

        {error && <ErrorState message={error} />}
        <FormActions
          onCancel={() => navigate(backPath)}
          busy={busy}
          submitLabel={editing ? "Save changes" : addingEmployee ? "Add person" : "Add customer"}
        />
      </form>
    </div>
  );
}
