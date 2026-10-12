import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams, Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiUploadCloud,
  FiClock,
  FiMapPin,
  FiShield,
  FiCalendar,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import { PageTitle, DoctorPortrait, Field, ErrorBox } from "../components/UI";
import { api, today, prettyDate, prettyTime } from "../lib/api";
import { notify, loadAppointments, loadCatalog } from "../store";
export default function Book() {
  const doctors = useSelector((s) => s.doctors);
  const catalogError = useSelector((s) => s.catalogError);
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const [specialty, setSpecialty] = useState(
    params.get("specialty") || "All specialists",
  );
  const [doctorId, setDoctorId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [comments, setComments] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [slotError, setSlotError] = useState("");
  const [slotVersion, setSlotVersion] = useState(0);
  const [success, setSuccess] = useState(null);
  const doctor = doctors.find((d) => d.id === doctorId);
  useEffect(() => {
    setTime("");
    setSlots([]);
    setSlotError("");
    if (!doctorId || !date) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    api("/availability?doctorId=" + doctorId + "&date=" + date)
      .then((data) => {
        if (active) setSlots(data);
      })
      .catch((e) => {
        if (active) setSlotError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [doctorId, date, slotVersion]);
  function upload(e) {
    const selected = Array.from(e.target.files || []);
    if (
      selected.length > 3 ||
      selected.some(
        (f) =>
          f.size > 5 * 1024 * 1024 ||
          !["application/pdf", "image/jpeg", "image/png"].includes(f.type),
      )
    ) {
      setError("Choose up to 3 PDF, JPG, or PNG reports, each under 5 MB.");
      e.target.value = "";
      return;
    }
    setFiles(selected);
    setError("");
  }
  async function submit(e) {
    e.preventDefault();
    if (!doctorId || !date || !time) {
      setError("Choose a doctor, date, and available time.");
      return;
    }
    setBusy(true);
    setError("");
    const body = new FormData();
    body.append("doctorId", doctorId);
    body.append("date", date);
    body.append("time", time);
    body.append("comments", comments);
    files.forEach((f) => body.append("reports", f));
    try {
      const result = await api("/appointments", { method: "POST", body });
      setSuccess(result);
      dispatch(loadAppointments());
      dispatch(notify("Your appointment is confirmed."));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
      if (e.status === 409) setSlotVersion((v) => v + 1);
    } finally {
      setBusy(false);
    }
  }
  if (success)
    return (
      <div className="booking-success panel">
        <span className="success-icon">
          <FiCheckCircle />
        </span>
        <span className="eyebrow">YOU’RE ALL SET</span>
        <h1>A little care is on the calendar.</h1>
        <p>
          Your appointment with <strong>{doctor?.name}</strong> is confirmed.
        </p>
        <div className="success-details">
          <span>
            <FiCalendar />
            {prettyDate(success.date)}
          </span>
          <span>
            <FiClock />
            {prettyTime(success.time)} IST
          </span>
          <span>
            <FiMapPin />
            Carewell clinic · In person
          </span>
        </div>
        <p className="muted">
          Please arrive 10 minutes before your appointment.
          <br />
          Consultation fee: ₹{doctor?.fee} · Pay at the clinic.
        </p>
        <Link to="/appointments" className="btn primary">
          View my appointments <FiArrowRight />
        </Link>
        <Link to="/" className="text-button">
          Back to dashboard
        </Link>
      </div>
    );
  const specialties = [
    "All specialists",
    ...new Set(doctors.map((d) => d.specialty)),
  ];
  const maxDate = new Date(Date.now() + 89 * 86400000)
    .toISOString()
    .slice(0, 10);
  return (
    <>
      <PageTitle
        eyebrow="MAKE TIME FOR YOURSELF"
        title="Book an appointment"
        description="Good care starts with a simple next step."
      />
      <ErrorBox
        message={catalogError}
        onRetry={() => dispatch(loadCatalog())}
      />
      <form className="booking-layout" onSubmit={submit}>
        <div className="booking-main">
          <section className="panel booking-section">
            <div className="step-heading">
              <span>01</span>
              <div>
                <h2>Find your specialist</h2>
                <p className="muted">Choose the care that’s right for you.</p>
              </div>
            </div>
            <div
              className="specialty-pills"
              aria-label="Filter doctors by specialty"
            >
              {specialties.map((s) => (
                <button
                  key={s}
                  type="button"
                  className={specialty === s ? "selected" : ""}
                  aria-pressed={specialty === s}
                  onClick={() => setSpecialty(s)}
                >
                  {s}
                </button>
              ))}
            </div>
            <div className="doctor-grid">
              {doctors
                .filter(
                  (d) =>
                    specialty === "All specialists" ||
                    d.specialty === specialty,
                )
                .map((d) => (
                  <button
                    type="button"
                    key={d.id}
                    className={
                      "doctor-card " + (doctorId === d.id ? "selected" : "")
                    }
                    onClick={() => setDoctorId(d.id)}
                    aria-pressed={doctorId === d.id}
                  >
                    <DoctorPortrait doctor={d} />
                    <span className="doctor-info">
                      <strong>{d.name}</strong>
                      <span>{d.specialty}</span>
                      <small>{d.experience} years of experience</small>
                      <b>
                        ₹{d.fee} <small>/ consultation</small>
                      </b>
                    </span>
                    <span className="radio-mark">
                      {doctorId === d.id && <FiCheck />}
                    </span>
                  </button>
                ))}
            </div>
          </section>
          <section className="panel booking-section">
            <div className="step-heading">
              <span>02</span>
              <div>
                <h2>A time that works for you</h2>
                <p className="muted">
                  All times are in India Standard Time (IST).
                </p>
              </div>
            </div>
            <Field
              label="Appointment date *"
              type="date"
              value={date}
              min={today()}
              max={maxDate}
              required
              onChange={(e) => setDate(e.target.value)}
            />
            <label className="slot-label">Available times *</label>
            <ErrorBox
              message={slotError}
              onRetry={() => setSlotVersion((v) => v + 1)}
            />
            {loading ? (
              <p className="muted">Checking available times…</p>
            ) : !doctorId || !date ? (
              <p className="slot-placeholder">
                Choose a doctor and date to see available times.
              </p>
            ) : slots.length ? (
              <div className="time-slots">
                {slots.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={time === s ? "selected" : ""}
                    aria-pressed={time === s}
                    onClick={() => setTime(s)}
                  >
                    {prettyTime(s)}
                  </button>
                ))}
              </div>
            ) : (
              !slotError && (
                <p className="slot-placeholder">
                  No times available. Please choose another date.
                </p>
              )
            )}
          </section>
          <section className="panel booking-section">
            <div className="step-heading">
              <span>03</span>
              <div>
                <h2>A little more about your visit</h2>
                <p className="muted">
                  Optional details to help your doctor prepare.
                </p>
              </div>
            </div>
            <Field label="Reason for your visit">
              <textarea
                rows="3"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                maxLength={1000}
                placeholder="Share your symptoms, questions, or anything you’d like us to know…"
              />
            </Field>
            <small className="character-count">{comments.length}/1000</small>
            <label className="report-upload">
              <FiUploadCloud />
              <strong>Upload medical reports</strong>
              <span>
                Choose files · PDF, JPG, PNG · Up to 3 files, 5 MB each
              </span>
              <input
                type="file"
                aria-label="Upload medical reports"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={upload}
              />
            </label>
            {files.length > 0 && (
              <div className="selected-files">
                {files.map((f, i) => (
                  <span key={f.name + i}>
                    {f.name}
                    <button
                      type="button"
                      aria-label={"Remove " + f.name}
                      onClick={() => setFiles(files.filter((_, j) => i !== j))}
                    >
                      <FiX />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>
        <aside className="booking-summary panel">
          <span className="eyebrow">YOUR NEXT STEP</span>
          <h2>Appointment summary</h2>
          {doctor ? (
            <div className="summary-doctor">
              <DoctorPortrait doctor={doctor} small />
              <div>
                <strong>{doctor.name}</strong>
                <small>{doctor.specialty}</small>
              </div>
            </div>
          ) : (
            <p className="summary-placeholder">
              Your chosen specialist will appear here.
            </p>
          )}
          <div className="summary-row">
            <FiCalendar />
            <span>{date ? prettyDate(date) : "Choose a date"}</span>
          </div>
          <div className="summary-row">
            <FiClock />
            <span>{time ? prettyTime(time) + " IST" : "Choose a time"}</span>
          </div>
          <div className="summary-row">
            <FiMapPin />
            <span>
              Carewell clinic<small>In-person consultation</small>
            </span>
          </div>
          <div className="summary-fee">
            <span>Consultation fee</span>
            <strong>{doctor ? "₹" + doctor.fee : "—"}</strong>
          </div>
          <small className="muted">
            Pay at the clinic. No online payment required.
          </small>
          <ErrorBox message={error} />
          <button
            disabled={busy || !doctorId || !date || !time || loading}
            className="btn primary full-width"
          >
            {busy ? "Confirming…" : "Confirm appointment"}
            <FiArrowRight />
          </button>
          <p className="summary-security">
            <FiShield /> Your reports are private to your account.
          </p>
          <p className="quiet-note">
            Need to change your plans? You can cancel an upcoming appointment
            from your account.
          </p>
        </aside>
      </form>
    </>
  );
}
