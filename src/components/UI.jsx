import { useState } from "react";
import {
  FiActivity,
  FiHeart,
  FiSmile,
  FiSun,
  FiZap,
  FiPlus,
  FiCheck,
  FiX,
  FiArrowUpRight,
  FiCalendar,
  FiClock,
  FiMapPin,
  FiFileText,
} from "react-icons/fi";
import { LuStethoscope, LuBrain } from "react-icons/lu";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { api, prettyDate, prettyTime, statusOf } from "../lib/api";
import { loadAppointments, notify } from "../store";
export function Logo() {
  return (
    <Link to="/" className="brand" aria-label="Carewell home">
      <span className="brand-mark">
        <FiPlus />
      </span>
      carewell<span className="brand-dot">.</span>
    </Link>
  );
}
export const iconMap = {
  heart: FiHeart,
  stethoscope: LuStethoscope,
  sparkles: FiSun,
  activity: FiActivity,
  smile: FiSmile,
  brain: LuBrain,
};
export function ServiceIcon({ name, ...props }) {
  const Icon = iconMap[name] || FiHeart;
  return <Icon {...props} />;
}
export function PageTitle({ eyebrow, title, description, children }) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow || "YOUR PERSONAL HEALTH SPACE"}</p>
        <h1>{title}</h1>
        {description && <p className="muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
export function Avatar({ user, size = "normal" }) {
  return (
    <span className={"avatar " + size}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.name} />
      ) : (
        user?.name
          ?.split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("") || "CW"
      )}
    </span>
  );
}
export function DoctorPortrait({ doctor, small = false }) {
  return (
    <div
      className={"doctor-portrait " + (small ? "small" : "")}
      style={{ background: doctor?.color || "#e8eddf" }}
    >
      <span>{doctor?.initials || "DR"}</span>
      <LuStethoscope aria-hidden="true" />
    </div>
  );
}
export function ErrorBox({ message, onRetry }) {
  if (!message) return null;
  return (
    <div className="error-box" role="alert">
      {message}
      {onRetry && (
        <button onClick={onRetry} className="text-button">
          Try again
        </button>
      )}
    </div>
  );
}
export function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <FiCalendar />
      </span>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {action && (
        <Link className="btn primary" to="/book">
          Book an appointment <FiArrowUpRight />
        </Link>
      )}
    </div>
  );
}
export function Toasts() {
  const toasts = useSelector((s) => s.toasts);
  const dispatch = useDispatch();
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + t.kind}>
          {t.kind === "success" ? <FiCheck /> : <FiZap />}
          <span>{t.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => dispatch({ type: "toast/remove", payload: t.id })}
          >
            <FiX />
          </button>
        </div>
      ))}
    </div>
  );
}
export function Field({ label, error, children, ...props }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children || <input {...props} />}{" "}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}
export function AppointmentCard({ appointment: a, compact = false }) {
  const doctor = useSelector((s) => s.doctors.find((d) => d.id === a.doctorId));
  const dispatch = useDispatch();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const status = statusOf(a);
  async function cancel() {
    setBusy(true);
    try {
      await api("/appointments/" + a._id + "/cancel", { method: "PATCH" });
      await dispatch(loadAppointments());
      dispatch(notify("Your appointment has been cancelled."));
      setConfirm(false);
    } catch (e) {
      dispatch(notify(e.message, "error"));
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={"appointment-card " + (compact ? "compact" : "")}>
      <div className="appointment-top">
        <DoctorPortrait doctor={doctor} small />
        <div className="grow">
          <h3>{doctor?.name || "Your doctor"}</h3>
          <p className="muted">{doctor?.specialty}</p>
        </div>
        <span className={"badge " + status}>
          <i />
          {status === "upcoming"
            ? "Confirmed"
            : status === "past"
              ? "Past visit"
              : "Cancelled"}
        </span>
      </div>
      <div className="appointment-meta">
        <span>
          <FiCalendar />
          {prettyDate(a.date)}
        </span>
        <span>
          <FiClock />
          {prettyTime(a.time)} IST
        </span>
      </div>
      <div className="appointment-bottom">
        <span className="muted">
          <FiMapPin /> Carewell clinic · In person
        </span>
        {compact ? (
          <Link to="/appointments" className="text-button">
            View details <FiArrowUpRight />
          </Link>
        ) : (
          status === "upcoming" && (
            <button
              className="text-button danger"
              onClick={() => setConfirm(!confirm)}
            >
              Cancel appointment
            </button>
          )
        )}
      </div>
      {!compact && a.comments && (
        <p className="appointment-note">{a.comments}</p>
      )}
      {!compact && a.reportIds?.length > 0 && (
        <div className="reports">
          {a.reportIds.map((r) => (
            <a key={r._id} href={"/api/reports/" + r._id} download>
              <FiFileText />
              {r.name}
            </a>
          ))}
        </div>
      )}
      {confirm && (
        <div className="cancel-confirm" role="alert">
          <p>Cancel this appointment? Your time slot will be released.</p>
          <button className="btn secondary" onClick={() => setConfirm(false)}>
            Keep appointment
          </button>
          <button disabled={busy} className="btn danger-btn" onClick={cancel}>
            {busy ? "Cancelling…" : "Yes, cancel"}
          </button>
        </div>
      )}
    </article>
  );
}
