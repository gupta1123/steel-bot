import { FormEvent, useEffect, useState } from "react";
import { ArrowLeft, CaretRight, Check, Package, PencilSimple, UsersThree, UserSwitch, X } from "@phosphor-icons/react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api";
import { EmptyState, ErrorState, LoadingState } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { Identity, OrderListItem, Role } from "../types";

type CustomerDetail = { item: Identity; recent_orders: OrderListItem[] };
type EmployeeDetail = { item: Identity; assigned_customers: Identity[] };

const statusTones: Record<string, string> = {
  "Order received": "received",
  Processing: "processing",
  Completed: "completed"
};

export default function PersonDetailPage({ role }: { role: Role }) {
  const { phone = "" } = useParams();
  const plural = role === "customer" ? "customers" : "employees";
  const { data, loading, error, reload } = useApiData<CustomerDetail | EmployeeDetail>(`/${plural}/${encodeURIComponent(phone)}`);
  const employees = useApiData<{ items: Identity[] }>(role === "customer" ? "/employees" : null);
  const navigate = useNavigate();
  const location = useLocation();
  const routeNotice = (location.state as { profileNotice?: string } | null)?.profileNotice || "";
  const item = data?.item;
  const [showAssignment, setShowAssignment] = useState(false);
  const [assignedEmployee, setAssignedEmployee] = useState("");
  const [savingAssignment, setSavingAssignment] = useState(false);
  const [assignmentError, setAssignmentError] = useState("");
  const [profileNotice, setProfileNotice] = useState(routeNotice);

  useEffect(() => {
    if (!routeNotice) return undefined;
    setProfileNotice(routeNotice);
    const timeout = window.setTimeout(() => {
      setProfileNotice("");
      navigate(location.pathname, { replace: true, state: null });
    }, 3000);
    return () => window.clearTimeout(timeout);
  }, [location.pathname, navigate, routeNotice]);

  useEffect(() => {
    if (!showAssignment) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !savingAssignment) setShowAssignment(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [savingAssignment, showAssignment]);

  useEffect(() => {
    if (!profileNotice || routeNotice) return undefined;
    const timeout = window.setTimeout(() => setProfileNotice(""), 3000);
    return () => window.clearTimeout(timeout);
  }, [profileNotice, routeNotice]);

  function openAssignment() {
    setAssignedEmployee(item?.assigned_employee_id || "");
    setAssignmentError("");
    setShowAssignment(true);
  }

  function closeAssignment() {
    if (!savingAssignment) setShowAssignment(false);
  }

  async function saveAssignment(event: FormEvent) {
    event.preventDefault();
    setSavingAssignment(true);
    setAssignmentError("");
    try {
      await api(`/customers/${encodeURIComponent(phone)}`, {
        method: "PATCH",
        body: { assigned_employee_id: assignedEmployee || null }
      });
      setShowAssignment(false);
      setProfileNotice("Assignment updated successfully");
      await reload();
    } catch (caught) {
      setAssignmentError(caught instanceof ApiError ? caught.message : "Unable to update this assignment");
    } finally {
      setSavingAssignment(false);
    }
  }

  return (
    <div className={`page detail-page ${role === "customer" ? "customer-detail-page" : "employee-detail-page"}`}>
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && role === "customer" && (
        <>
          <header className="customer-profile-header">
            <button type="button" onClick={() => navigate("/customers")} aria-label="Back to customers">
              <ArrowLeft size={21} weight="bold" />
            </button>
            <div>
              <h1>{item.name}</h1>
              <p>{item.company_name || "Customer"}</p>
            </div>
          </header>

          <div className="customer-detail-workspace">
            <div className="customer-detail-primary">
              <section className="customer-orders-card">
                <div className="customer-detail-card-heading">
                  <Package size={20} weight="bold" />
                  <div>
                    <h2>Recent orders</h2>
                    <p>{(data as CustomerDetail).recent_orders.length} {(data as CustomerDetail).recent_orders.length === 1 ? "order" : "orders"} shown</p>
                  </div>
                </div>
                {(data as CustomerDetail).recent_orders.length === 0 ? (
                  <EmptyState title="No orders yet" message="Orders from this customer will appear here." />
                ) : (
                  <div className="customer-order-ledger">
                    {(data as CustomerDetail).recent_orders.map((order) => (
                      <button
                        className="customer-order-ledger-row"
                        type="button"
                        key={order.order_id}
                        onClick={() => navigate(`/orders/${encodeURIComponent(order.order_id)}`)}
                      >
                        <span className="customer-order-ledger-copy">
                          <strong>{order.item_summary}</strong>
                          <small><span>{order.order_id}</span><i aria-hidden="true" /><span>{formatDate(order.created_at)}</span></small>
                        </span>
                        <span className="customer-order-ledger-action">
                          <span className={`order-status-badge ${statusTones[order.status_label] || "default"}`}>{order.status_label}</span>
                          <CaretRight size={19} weight="bold" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="customer-detail-sidebar">
              <section className="customer-profile-card">
                <div className="customer-profile-card-header">
                  <span className={`customer-status-badge ${item.active ? "active" : "inactive"}`}>{item.active ? "Active profile" : "Inactive profile"}</span>
                </div>
                <dl className="customer-profile-specs">
                  <div><dt>Phone</dt><dd>+{item.phone}</dd></div>
                  <div><dt>Company</dt><dd>{item.company_name || "Not added"}</dd></div>
                  <div><dt>Role</dt><dd>Customer</dd></div>
                  <div><dt>Assigned employee</dt><dd>{item.assigned_employee_name || "Unassigned"}</dd></div>
                  <div><dt>Total orders</dt><dd>{item.order_count}</dd></div>
                </dl>
                <div className="customer-profile-actions">
                  <button className="customer-profile-primary-action" type="button" onClick={() => navigate(`/customers/${item.phone}/edit`)}>
                    <PencilSimple size={18} weight="bold" /> Edit profile
                  </button>
                  <button className="customer-profile-secondary-action" type="button" onClick={openAssignment}>
                    <UserSwitch size={18} weight="bold" /> Change assignment
                  </button>
                </div>
              </section>
            </aside>
          </div>

          {showAssignment && (
            <div className="assignment-modal-overlay" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && closeAssignment()}>
              <form className="assignment-modal" role="dialog" aria-modal="true" aria-labelledby="assignment-modal-title" onSubmit={saveAssignment}>
                <div className="assignment-modal-header">
                  <div>
                    <span className="eyebrow">Customer routing</span>
                    <h2 id="assignment-modal-title">Change assigned employee</h2>
                  </div>
                  <button type="button" onClick={closeAssignment} aria-label="Close assignment" disabled={savingAssignment}><X size={19} /></button>
                </div>
                <div className="assignment-modal-body">
                  <label className="field">
                    <span>Assigned employee</span>
                    <select value={assignedEmployee} onChange={(event) => setAssignedEmployee(event.target.value)} disabled={employees.loading || savingAssignment} autoFocus>
                      <option value="">Unassigned</option>
                      {(employees.data?.items || [])
                        .filter((employee) => employee.active || employee.identity_id === item.assigned_employee_id)
                        .map((employee) => (
                          <option key={employee.identity_id} value={employee.identity_id}>{employee.name}{employee.active ? "" : " (inactive)"}</option>
                        ))}
                    </select>
                  </label>
                  {employees.error && <ErrorState message="Employee assignments could not be loaded." onRetry={employees.reload} />}
                  {assignmentError && <ErrorState message={assignmentError} />}
                </div>
                <div className="assignment-modal-actions">
                  <button className="button secondary" type="button" onClick={closeAssignment} disabled={savingAssignment}>Cancel</button>
                  <button className="button primary" type="submit" disabled={savingAssignment || employees.loading || Boolean(employees.error)}>{savingAssignment ? "Saving…" : "Confirm change"}</button>
                </div>
              </form>
            </div>
          )}

        </>
      )}

      {item && role !== "customer" && (
        <>
          <header className="employee-profile-header">
            <button type="button" onClick={() => navigate("/employees")} aria-label="Back to employees">
              <ArrowLeft size={21} weight="bold" />
            </button>
            <div>
              <h1>{item.name}</h1>
              <p>Employee</p>
            </div>
          </header>

          <div className="employee-detail-workspace">
            <div className="employee-detail-primary">
              <section className="employee-customers-card">
                <div className="employee-detail-card-heading">
                  <UsersThree size={20} weight="bold" />
                  <h2>Assigned Customers</h2>
                </div>
                {(data as EmployeeDetail).assigned_customers.length === 0 ? (
                  <div className="employee-empty-state">
                    <span className="employee-empty-icon"><Check size={21} weight="bold" /></span>
                    <strong>No assigned customers</strong>
                    <p>Assign customers to this employee from their respective profile pages.</p>
                  </div>
                ) : (
                  <div className="employee-customer-list">
                    {(data as EmployeeDetail).assigned_customers.map((customer) => (
                      <button
                        className="employee-customer-row"
                        type="button"
                        key={customer.phone}
                        onClick={() => navigate(`/customers/${encodeURIComponent(customer.phone)}`)}
                      >
                        <span className="employee-customer-copy">
                          <strong>{customer.name}</strong>
                          <small>{customer.company_name || `+${customer.phone}`}</small>
                        </span>
                        <span className="employee-customer-action">
                          <span className={`employee-status-badge ${customer.active ? "active" : "inactive"}`}>{customer.active ? "Active" : "Inactive"}</span>
                          <CaretRight size={19} weight="bold" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <aside className="employee-detail-sidebar">
              <section className="employee-profile-card">
                <div className="employee-profile-card-header">
                  <span className={`employee-profile-badge ${item.active ? "active" : "inactive"}`}>{item.active ? "Active profile" : "Inactive profile"}</span>
                </div>
                <dl className="employee-profile-specs">
                  <div><dt>Phone</dt><dd>+{item.phone}</dd></div>
                  <div><dt>Company</dt><dd className={item.company_name ? "" : "empty"}>{item.company_name || "Not added"}</dd></div>
                  <div><dt>Role</dt><dd>Employee</dd></div>
                </dl>
                <button className="employee-profile-edit" type="button" onClick={() => navigate(`/employees/${item.phone}/edit`)}>Edit Profile</button>
              </section>
            </aside>
          </div>
        </>
      )}

      {profileNotice && (
        <div className="profile-save-toast show" role="status" aria-live="polite">{profileNotice}</div>
      )}
    </div>
  );
}
