import React from "react";
import ReactDOM from "react-dom/client";
import { Provider, useSelector, useDispatch } from "react-redux";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { store, bootstrap } from "./store";
import Layout from "./components/Layout";
import { Toasts, ErrorBox } from "./components/UI";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Book from "./pages/Book";
import Appointments from "./pages/Appointments";
import Profile from "./pages/Profile";
import Services from "./pages/Services";
import "./styles.css";
function Protected() {
  const user = useSelector((s) => s.user);
  const authReady = useSelector((s) => s.authReady);
  const authError = useSelector((s) => s.authError);
  const dispatch = useDispatch();
  if (!authReady)
    return (
      <div className="full-loading">
        <span className="loader" />
        Getting your space ready…
      </div>
    );
  if (authError)
    return (
      <div className="full-loading">
        <ErrorBox message={authError} onRetry={() => dispatch(bootstrap())} />
      </div>
    );
  return user ? <Layout /> : <Navigate to="/login" replace />;
}
function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(bootstrap());
  }, [dispatch]);
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Routes>
        <Route path="/login" element={<Auth />} />
        <Route path="/signup" element={<Auth signup />} />
        <Route element={<Protected />}>
          <Route index element={<Dashboard />} />
          <Route path="/book" element={<Book />} />
          <Route path="/appointments" element={<Appointments />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/services" element={<Services />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toasts />
    </>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
