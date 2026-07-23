import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ErrorState, LoadingState, PageHeader, PrimaryButton, RowLink, SearchBox, StatusPill } from "../components";
import { useApiData } from "../hooks";
import type { Identity, Role } from "../types";

export default function PeopleListPage({ role }: { role: Role }) {
  const plural = role === "customer" ? "customers" : "employees";
  const title = role === "customer" ? "Customers" : "Employees";
  const { data, loading, error, reload } = useApiData<{ items: Identity[]; total: number }>(`/${plural}`);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const navigate = useNavigate();
  const items = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return (data?.items || []).filter((item) => {
      const searchText = `${item.name} ${item.company_name || ""} ${item.phone}`.toLocaleLowerCase();
      const statusMatches = status === "all" || (status === "active" ? item.active : !item.active);
      return searchText.includes(needle) && statusMatches;
    });
  }, [data, query, status]);

  return (
    <div className="page">
      <PageHeader
        title={title}
        description={role === "customer" ? "View and manage your customers in one place." : "Manage the people who support your customers."}
        action={<PrimaryButton onClick={() => navigate(`/${plural}/new`)}>Add {role === "customer" ? "customer" : "employee"}</PrimaryButton>}
      />
      <div className="toolbar">
        <SearchBox value={query} onChange={setQuery} placeholder={`Search ${plural} by name or company`} />
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
        <section className="list-section no-top-margin">
          <div className="list-meta">{items.length} {items.length === 1 ? title.slice(0, -1).toLocaleLowerCase() : plural}</div>
          <div className="data-list">
            <div className="list-head people-grid">
              <span>{role === "customer" ? "Customer" : "Employee"}</span>
              <span>{role === "customer" ? "Assigned employee" : "Customers"}</span>
              <span>{role === "customer" ? "Orders" : "Status"}</span>
              <span>Status</span>
              <span />
            </div>
            {items.map((item) => (
              <div className="list-row people-grid" key={item.phone}>
                <div className="identity-cell">
                  <span className="initials">{item.name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span>
                  <span className="primary-cell"><strong>{item.name}</strong><small>{item.company_name || item.phone}</small></span>
                </div>
                <span>{role === "customer" ? item.assigned_employee_name || "Unassigned" : `${item.assigned_customer_count} assigned`}</span>
                <span>{role === "customer" ? item.order_count : (item.active ? "Available" : "Unavailable")}</span>
                <StatusPill active={item.active} />
                <RowLink to={`/${plural}/${item.phone}`} label={`Open ${item.name}`} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
