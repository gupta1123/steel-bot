export type Role = "customer" | "internal_employee";

export type Identity = {
  phone: string;
  identity_id: string;
  name: string;
  company_name?: string | null;
  role: Role;
  active: boolean;
  assigned_employee_id?: string | null;
  assigned_employee_name?: string | null;
  order_count: number;
  assigned_customer_count: number;
};

export type OrderListItem = {
  order_id: string;
  customer_id?: string | null;
  customer_phone?: string | null;
  customer_name?: string | null;
  company_name?: string | null;
  status_label: string;
  item_summary: string;
  delivery_location?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type LineItem = {
  product_key?: string;
  product_label?: string;
  size?: string;
  grade?: string;
  quantity?: string;
  quantity_value?: string;
  quantity_unit?: string;
};

export type StatusEvent = {
  label: string;
  at?: string;
  source?: string;
  note?: string;
  note_audience?: "internal" | "customer";
  tracking_reference?: string;
  estimated_delivery?: string;
  updated_by_name?: string;
};

export type Order = {
  order_id: string;
  customer_id?: string;
  customer_phone?: string;
  customer_name?: string;
  company_name?: string;
  created_by_name?: string;
  status?: string;
  status_label?: string;
  created_at?: string;
  updated_at?: string;
  draft?: {
    line_items?: LineItem[];
    product_key?: string;
    product_label?: string;
    size?: string;
    quantity?: string;
    quantity_value?: string;
    quantity_unit?: string;
    delivery_location?: string;
    required_by?: string;
  };
  status_history?: StatusEvent[];
};

export type ProductListItem = {
  product_key: string;
  label: string;
  active: boolean;
  sizes: string[];
  units: string[];
  order_count: number;
};

export type Product = {
  product_key: string;
  label: string;
  aliases: string[];
  sizes: string[];
  grades: string[];
  quantity_options: string[];
  units: string[];
  active: boolean;
};

export type AuditEvent = {
  id?: number;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_key: string;
  summary: string;
  created_at: string;
};
