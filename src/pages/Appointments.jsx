import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiPlus, FiSearch } from "react-icons/fi";
import { loadAppointments } from "../store";
import {
  PageTitle,
  AppointmentCard,
  EmptyState,
  ErrorBox,
} from "../components/UI";
import { statusOf } from "../lib/api";
export default function Appointments() {
  const dispatch = useDispatch();
  const appointments = useSelector((s) => s.appointments);
  const appointmentsLoading = useSelector((s) => s.appointmentsLoading);
  const appointmentsError = useSelector((s) => s.appointmentsError);
  const [tab, setTab] = useState("upcoming");
  const [year, setYear] = useState("all");
  useEffect(() => {
    dispatch(loadAppointments());
  }, [dispatch]);
  const years = [...new Set(appointments.map((a) => a.date.slice(0, 4)))]
    .sort()
    .reverse();
  const filtered = appointments
    .filter(
      (a) =>
        (tab === "all" || statusOf(a) === tab) &&
        (year === "all" || a.date.startsWith(year)),
    )
    .sort((a, b) =>
      tab === "upcoming"
        ? (a.date + a.time).localeCompare(b.date + b.time)
        : (b.date + b.time).localeCompare(a.date + a.time),
    );
  return (
    <>
      <PageTitle
        eyebrow="YOUR CARE JOURNEY"
        title="My appointments"
        description="Every visit, every next step. All in one place."
      >
        <Link className="btn primary" to="/book">
          <FiPlus /> Book an appointment
        </Link>
      </PageTitle>
      <div className="appointment-filters">
        <div className="tabs" aria-label="Appointment status">
          {[
            ["upcoming", "Upcoming"],
            ["past", "Past visits"],
            ["cancelled", "Cancelled"],
            ["all", "All appointments"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={tab === value ? "active" : ""}
              aria-pressed={tab === value}
              onClick={() => setTab(value)}
            >
              {label}
              <span>
                {
                  appointments.filter(
                    (a) => value === "all" || statusOf(a) === value,
                  ).length
                }
              </span>
            </button>
          ))}
        </div>
        <label className="year-filter">
          Year{" "}
          <select
            aria-label="Filter appointments by year"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="all">All years</option>
            {years.map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>
      <ErrorBox
        message={appointmentsError}
        onRetry={() => dispatch(loadAppointments())}
      />
      {appointmentsLoading ? (
        <div className="panel loading-panel">Loading appointments…</div>
      ) : filtered.length ? (
        <div className="appointment-grid">
          {filtered.map((a) => (
            <AppointmentCard key={a._id} appointment={a} />
          ))}
        </div>
      ) : (
        !appointmentsError && (
          <div className="panel">
            <EmptyState
              title={
                tab === "upcoming"
                  ? "A little care starts here."
                  : "No appointments found"
              }
              description={
                tab === "upcoming"
                  ? "Choose a specialist and find a time that works for you."
                  : "Try another year or appointment category."
              }
              action={tab === "upcoming"}
            />
          </div>
        )
      )}
      <p className="quiet-note">
        All appointments are in person at Carewell clinic. Times are shown in
        India Standard Time (IST).
      </p>
    </>
  );
}
