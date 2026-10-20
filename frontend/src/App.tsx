import { Routes, Route } from "react-router-dom";
import MenuPage from "@/pages/Menu";
import OrderStatusPage from "@/pages/OrderStatus";
import AdminPage from "@/pages/Admin";
import { CartProvider } from "@/lib/cart";
import { Toaster } from "@/components/ui/sonner";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <CartProvider>
      <Routes>
        <Route path="/" element={<MenuPage />} />
        <Route path="/pedido/:id" element={<OrderStatusPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<MenuPage />} />
      </Routes>
      <Toaster richColors duration={2200} />
    </CartProvider>
  );
}
