import { createStore, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import { api } from "../lib/api";
const initial = {
  user: null,
  authReady: false,
  authError: null,
  appointments: [],
  appointmentsLoading: false,
  appointmentsError: null,
  doctors: [],
  services: [],
  catalogError: null,
  toasts: [],
  demo: false,
};
function reducer(state = initial, action) {
  switch (action.type) {
    case "auth/ready":
      return {
        ...state,
        authReady: true,
        user: action.payload,
        authError: null,
      };
    case "auth/error":
      return { ...state, authReady: true, authError: action.payload };
    case "user/set":
      return { ...state, user: action.payload };
    case "auth/logout":
      return { ...state, user: null, appointments: [] };
    case "appointments/loading":
      return { ...state, appointmentsLoading: true, appointmentsError: null };
    case "appointments/set":
      return {
        ...state,
        appointments: action.payload,
        appointmentsLoading: false,
      };
    case "appointments/error":
      return {
        ...state,
        appointmentsError: action.payload,
        appointmentsLoading: false,
      };
    case "catalog/set":
      return { ...state, ...action.payload, catalogError: null };
    case "catalog/error":
      return { ...state, catalogError: action.payload };
    case "toast/add":
      return { ...state, toasts: [...state.toasts, action.payload] };
    case "toast/remove":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
}
export const store = createStore(reducer, applyMiddleware(thunk));
export const notify =
  (message, kind = "success") =>
  (dispatch) => {
    const id = crypto.randomUUID();
    dispatch({ type: "toast/add", payload: { id, message, kind } });
    setTimeout(() => dispatch({ type: "toast/remove", payload: id }), 5000);
  };
export const loadAppointments = () => async (dispatch) => {
  dispatch({ type: "appointments/loading" });
  try {
    dispatch({ type: "appointments/set", payload: await api("/appointments") });
  } catch (e) {
    dispatch({ type: "appointments/error", payload: e.message });
  }
};
export const loadCatalog = () => async (dispatch) => {
  try {
    const [doctors, services, health] = await Promise.all([
      api("/doctors"),
      api("/services"),
      api("/health"),
    ]);
    dispatch({
      type: "catalog/set",
      payload: { doctors, services, demo: health.demo },
    });
  } catch (e) {
    dispatch({ type: "catalog/error", payload: e.message });
  }
};
export const bootstrap = () => async (dispatch) => {
  dispatch(loadCatalog());
  try {
    dispatch({ type: "auth/ready", payload: await api("/auth/me") });
  } catch (e) {
    dispatch(
      e.status === 401
        ? { type: "auth/ready", payload: null }
        : { type: "auth/error", payload: e.message },
    );
  }
};
export const authenticate = (mode, values) => async (dispatch) => {
  const user = await api("/auth/" + mode, { method: "POST", body: values });
  dispatch({ type: "auth/ready", payload: user });
  dispatch(
    notify(
      mode === "login"
        ? "Welcome back. You’re successfully logged in."
        : "Your account is ready. Welcome to Carewell!",
    ),
  );
};
export const logout = () => async (dispatch) => {
  await api("/auth/logout", { method: "POST" });
  dispatch({ type: "auth/logout" });
};
