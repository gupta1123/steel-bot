import { CaretRight } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingState, PageHeader, PrimaryButton, SearchBox } from "../components";
import { useApiData } from "../hooks";
import type { Identity, Role } from "../types";

function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

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
      const availability = item.active ? "available active" : "unavailable inactive";
      const searchText = `${item.name} ${item.company_name || ""} ${item.phone} ${availability}`.toLocaleLowerCase();
      const statusMatches = status === "all" || (status === "active" ? item.active : !item.active);
      return searchText.includes(needle) && statusMatches;
    });
  }, [data, query, status]);

  return (
    <div className={`page ${role === "customer" ? "customers-page" : "employees-page"}`}>
      <PageHeader
        title={title}
        description={role === "customer" ? "View and manage your customers in one place." : "Manage the people who support your customers."}
        action={<PrimaryButton onClick={() => navigate(`/${plural}/new`)}>{role === "customer" ? "Add customer" : "Add Employee"}</PrimaryButton>}
      />
      <div className={role === "customer" ? "customer-control-strip" : "employee-control-strip"}>
        <div className={role === "customer" ? "customer-search" : "employee-search"}>
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder={role === "customer" ? "Search by name, company or phone..." : "Search by name, phone or availability..."}
          />
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
      {data && role === "customer" && (
        <section className="customer-list-section">
          <div className="customer-list-meta">{items.length} {items.length === 1 ? "customer" : "customers"}</div>
          <div className="customer-table-card">
            {items.length === 0 ? (
              <EmptyState title="No matching customers" message="Try a different search or status filter." />
            ) : (
              <div className="customer-table-scroll">
                <table className="customer-data-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Assigned employee</th>
                      <th>Orders</th>
                      <th>Status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.phone}>
                        <td>
                          <div className="customer-identity-cell">
                            <span className="customer-avatar">{initials(item.name)}</span>
                            <span className="customer-details">
                              <strong>{item.name}</strong>
                              <small>{[item.company_name, item.phone].filter(Boolean).join(" · ")}</small>
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={`customer-assignment${item.assigned_employee_name ? " assigned" : ""}`}>
                            <i aria-hidden="true" />
                            <span>{item.assigned_employee_name || "Unassigned"}</span>
                          </div>
                        </td>
                        <td><strong className="customer-order-count">{item.order_count}</strong></td>
                        <td><span className={`customer-status-badge ${item.active ? "active" : "inactive"}`}>{item.active ? "Active" : "Inactive"}</span></td>
                        <td>
                          <button
                            className="customer-open-button"
                            type="button"
                            onClick={() => navigate(`/customers/${encodeURIComponent(item.phone)}`)}
                            aria-label={`Open ${item.name}`}
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
      {data && role !== "customer" && (
        <section className="employee-list-section">
          <div className="employee-list-meta">{items.length} {items.length === 1 ? "employee" : "employees"}</div>
          <div className="employee-table-card">
            {items.length === 0 ? (
              <EmptyState title="No matching employees" message="Try a different search or status filter." />
            ) : (
              <div className="employee-table-scroll">
                <table className="employee-data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Customers</th>
                      <th>Availability</th>
                      <th>Account status</th>
                      <th><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.phone}>
                        <td>
                          <div className="employee-identity-cell">
                            <span className="employee-avatar">{initials(item.name)}</span>
                            <span className="employee-details">
                              <strong>{item.name}</strong>
                              <small>{item.phone}</small>
                            </span>
                          </div>
                        </td>
                        <td><span className="employee-assignment-count">{item.assigned_customer_count} assigned</span></td>
                        <td>
                          <span className={`employee-availability ${item.active ? "available" : "unavailable"}`}>
                            <i aria-hidden="true" />
                            {item.active ? "Available" : "Unavailable"}
                          </span>
                        </td>
                        <td><span className={`employee-status-badge ${item.active ? "active" : "inactive"}`}>{item.active ? "Active" : "Inactive"}</span></td>
                        <td>
                          <button
                            className="employee-open-button"
                            type="button"
                            onClick={() => navigate(`/employees/${encodeURIComponent(item.phone)}`)}
                            aria-label={`Open ${item.name}`}
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
