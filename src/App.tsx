import { useEffect, useState } from "react";
import { Navigate, Outlet, Route, Routes, useLocation } from "react-router-dom";
import { ADMIN_UNAUTHORIZED_EVENT, api, ApiError } from "./api";
import { AppShell, LoadingState } from "./components";
import LoginPage from "./pages/LoginPage";
import OverviewPage from "./pages/OverviewPage";
import PeopleListPage from "./pages/PeopleListPage";
import PersonDetailPage from "./pages/PersonDetailPage";
import PersonFormPage from "./pages/PersonFormPage";
import ProductsListPage from "./pages/ProductsListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ProductFormPage from "./pages/ProductFormPage";
import OrdersListPage from "./pages/OrdersListPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import SettingsPage from "./pages/SettingsPage";

function ProtectedLayout({ authenticated }: { authenticated: boolean }) {
  const location = useLocation();
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <AppShell><Outlet /></AppShell>;
}

export default function App() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => setAuthenticated(false);
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
    api<{ ok: boolean }>("/auth/me")
      .then(() => setAuthenticated(true))
      .catch((error: unknown) => {
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error(error);
        }
        setAuthenticated(false);
      })
      .finally(() => setChecking(false));
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, handleUnauthorized);
  }, []);

  if (checking) {
    return <div className="startup"><LoadingState /></div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated
            ? <Navigate to="/" replace />
            : <LoginPage onSignedIn={() => setAuthenticated(true)} />
        }
      />
      <Route element={<ProtectedLayout authenticated={authenticated} />}>
        <Route index element={<OverviewPage />} />
        <Route path="customers" element={<PeopleListPage role="customer" />} />
        <Route path="customers/new" element={<PersonFormPage role="customer" />} />
        <Route path="customers/:phone" element={<PersonDetailPage role="customer" />} />
        <Route path="customers/:phone/edit" element={<PersonFormPage role="customer" />} />
        <Route path="employees" element={<PeopleListPage role="internal_employee" />} />
        <Route path="employees/new" element={<PersonFormPage role="internal_employee" />} />
        <Route path="employees/:phone" element={<PersonDetailPage role="internal_employee" />} />
        <Route path="employees/:phone/edit" element={<PersonFormPage role="internal_employee" />} />
        <Route path="products" element={<ProductsListPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productKey" element={<ProductDetailPage />} />
        <Route path="products/:productKey/edit" element={<ProductFormPage />} />
        <Route path="orders" element={<OrdersListPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
