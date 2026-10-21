// Mirrors backend/models/shop.py — keep in sync by hand.
export type PaymentMethod = "pix" | "cartao_credito" | "cartao_debito" | "dinheiro";
export type OrderStatus = "recebido" | "preparando" | "saiu_entrega" | "entregue" | "cancelado";

export interface Category {
  id: string;
  name: string;
}

export interface Addon {
  id: string;
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  allows_addons: boolean;
  badge: string | null;
  available: boolean;
  position: number;
}

export interface MenuItemUpdate {
  name?: string;
  price?: number;
  description?: string;
  image?: string;
  badge?: string;
  available?: boolean;
}

export interface ImageUploaded {
  url: string;
}

export interface DayHours {
  day: number; // 0 = segunda ... 6 = domingo
  enabled: boolean;
  open: string;
  close: string;
}

export interface StoreSettings {
  force_closed: boolean;
  hours: DayHours[];
}

export interface StoreStatus {
  is_open: boolean;
  message: string;
  force_closed: boolean;
  hours: DayHours[];
}

export interface Menu {
  categories: Category[];
  items: MenuItem[];
  addons: Addon[];
}

export interface OrderItemIn {
  item_id: string;
  quantity: number;
  addon_ids: string[];
  note: string;
}

export interface OrderCreate {
  customer_name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  payment_method: PaymentMethod;
  change_for: number | null;
  notes: string;
  items: OrderItemIn[];
}

export interface OrderLine {
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  addons: Addon[];
  note: string;
  line_total: number;
}

export interface Order {
  id: string;
  code: string;
  customer_name: string;
  phone: string;
  street: string;
  number: string;
  neighborhood: string;
  complement: string;
  payment_method: PaymentMethod;
  change_for: number | null;
  notes: string;
  items: OrderLine[];
  total: number;
  status: OrderStatus;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface AdminMe {
  authenticated: boolean;
}

export interface AdminStats {
  date: string;
  orders_today: number;
  revenue_today: number;
  by_status: Record<string, number>;
}
