// Hand-written mirrors of backend/models/order.py — keep in sync.
export type Availability = "available" | "need_market" | "unavailable";
export type Speed = "express" | "normal";
export type Stage =
  | "on_hold"
  | "payment_pending"
  | "procurement"
  | "billing"
  | "packing"
  | "tracking"
  | "shipped"
  | "delivered";

export interface Item {
  id: string;
  name: string;
  qty: number;
  unit: string;
  price: number;
  hts_code: string;
  availability: Availability;
  note: string;
}

export interface Shipment {
  id: string;
  label: string;
  recipient: string;
  address: string;
  country: string;
  speed: Speed;
  courier: string;
  tracking_ids: string[];
  tracking_notes: string;
  photos: string[];
  allocations: Record<string, number>;
  bill_ready: boolean;
  packed: boolean;
  tracking_added: boolean;
  delivered: boolean;
  created_at: string;
}

export interface Activity {
  at: string;
  actor: string;
  text: string;
}

export interface Order {
  id: string;
  order_no: number;
  client_name: string;
  client_phone: string;
  client_email: string;
  country: string;
  currency: string;
  assigned_to: string;
  notes: string;
  payment_received: boolean;
  payment_amount: number;
  payment_method: string;
  on_hold: boolean;
  hold_reason: string;
  show_hts: boolean;
  items: Item[];
  shipments: Shipment[];
  activity: Activity[];
  created_at: string;
  updated_at: string;
  stage: Stage;
}

export interface ItemIn {
  name: string;
  qty: number;
  unit: string;
  price?: number;
  hts_code?: string;
  availability?: Availability;
  note?: string;
  actor?: string;
}

export interface OrderCreate {
  client_name: string;
  client_phone: string;
  client_email: string;
  country: string;
  currency: string;
  assigned_to: string;
  notes: string;
  payment_received: boolean;
  payment_amount: number;
  payment_method: string;
  address: string;
  shipment_count: number;
  speed: Speed;
  items: ItemIn[];
  actor: string;
}

export interface DashboardStats {
  total_orders: number;
  open_orders: number;
  by_stage: Record<string, number>;
  pending_items: number;
  bill_pending: number;
  packing_due: number;
  tracking_needed: number;
  express_open: number;
  by_country: Record<string, number>;
  recent: Order[];
}

export interface ProcurementEntry {
  order_id: string;
  order_no: number;
  client_name: string;
  assigned_to: string;
  item_id: string;
  qty: number;
  unit: string;
  availability: Availability;
  note: string;
}

export interface ProcurementGroup {
  name: string;
  unit: string;
  total_qty: number;
  need_market: number;
  unavailable: number;
  entries: ProcurementEntry[];
}

export interface Member {
  id: string;
  name: string;
  role: string;
  created_at: string;
}
