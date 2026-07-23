import { PencilSimple } from "@phosphor-icons/react";
import { useNavigate, useParams } from "react-router-dom";
import { DetailCard, DetailRow, EmptyState, ErrorState, LoadingState, PageHeader, RowLink, SecondaryButton, StatusPill } from "../components";
import { formatDate, useApiData } from "../hooks";
import type { Identity, OrderListItem, Role } from "../types";

type CustomerDetail = { item: Identity; recent_orders: OrderListItem[] };
type EmployeeDetail = { item: Identity; assigned_customers: Identity[] };

export default function PersonDetailPage({ role }: { role: Role }) {
  const { phone = "" } = useParams();
  const plural = role === "customer" ? "customers" : "employees";
  const { data, loading, error, reload } = useApiData<CustomerDetail | EmployeeDetail>(`/${plural}/${encodeURIComponent(phone)}`);
  const navigate = useNavigate();
  const item = data?.item;
  return (
    <div className="page detail-page">
      {loading && <LoadingState />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {item && (
        <>
          <PageHeader
            title={item.name}
            description={item.company_name || (role === "customer" ? "Customer" : "Employee")}
            backTo={`/${plural}`}
            action={<SecondaryButton onClick={() => navigate(`/${plural}/${item.phone}/edit`)}><PencilSimple size={18} /> Edit</SecondaryButton>}
          />
          <div className="detail-layout">
            <DetailCard title="Profile">
              <DetailRow label="Phone">+{item.phone}</DetailRow>
              <DetailRow label="Company">{item.company_name || "Not added"}</DetailRow>
              <DetailRow label="Role">{role === "customer" ? "Customer" : "Employee"}</DetailRow>
              {role === "customer" && <DetailRow label="Assigned employee">{item.assigned_employee_name || "Unassigned"}</DetailRow>}
              <DetailRow label="Status"><StatusPill active={item.active} /></DetailRow>
            </DetailCard>
            {role === "customer" ? (
              <DetailCard title="Recent orders">
                {(data as CustomerDetail).recent_orders.length === 0 ? (
                  <EmptyState title="No orders yet" message="Orders from this customer will appear here." />
                ) : (
                  <div className="simple-rows">
                    {(data as CustomerDetail).recent_orders.map((order) => (
                      <div className="simple-row" key={order.order_id}>
                        <span className="primary-cell"><strong>{order.item_summary}</strong><small>{order.order_id} · {formatDate(order.created_at)}</small></span>
                        <StatusPill label={order.status_label} />
                        <RowLink to={`/orders/${order.order_id}`} label={`Open ${order.order_id}`} />
                      </div>
                    ))}
                  </div>
                )}
              </DetailCard>
            ) : (
              <DetailCard title="Assigned customers">
                {(data as EmployeeDetail).assigned_customers.length === 0 ? (
                  <EmptyState title="No assigned customers" message="Assign customers from their profile page." />
                ) : (
                  <div className="simple-rows">
                    {(data as EmployeeDetail).assigned_customers.map((customer) => (
                      <div className="simple-row" key={customer.phone}>
                        <span className="primary-cell"><strong>{customer.name}</strong><small>{customer.company_name || customer.phone}</small></span>
                        <StatusPill active={customer.active} />
                        <RowLink to={`/customers/${customer.phone}`} label={`Open ${customer.name}`} />
                      </div>
                    ))}
                  </div>
                )}
              </DetailCard>
            )}
          </div>
        </>
      )}
    </div>
  );
}
