import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  FiArrowUpRight,
  FiArrowRight,
  FiCalendar,
  FiCheckCircle,
  FiFileText,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiHeart,
  FiCheck,
} from "react-icons/fi";
import { loadAppointments, loadCatalog } from "../store";
import {
  PageTitle,
  AppointmentCard,
  EmptyState,
  ServiceIcon,
  ErrorBox,
} from "../components/UI";
import { statusOf } from "../lib/api";
export function CareIllustration() {
  return (
    <div className="care-art" aria-hidden="true">
      <div className="art-orbit" />
      <div className="art-circle" />
      <svg viewBox="0 0 300 300" className="doctor-art">
        <path
          d="M53 298c3-64 28-94 79-101h41c48 7 76 36 80 101"
          fill="#fbfcf7"
        />
        <path d="m130 181 2 30 20 25 22-25-3-30" fill="#d8a886" />
        <path
          d="m127 203 25 33-22 55-34-78zM177 204l-25 32 24 55 31-76z"
          fill="#e1e9e6"
        />
        <path d="m133 217 19 19 18-20-4 82h-28z" fill="#2d8475" />
        <ellipse cx="152" cy="132" rx="50" ry="61" fill="#e7bb97" />
        <path
          d="M102 133c-15-42 2-81 36-83 40-14 77 24 62 79l-12-33c-35 1-46-10-49-19-6 15-19 26-33 29z"
          fill="#284b40"
        />
        <path
          d="M142 160q13 11 26-1"
          fill="none"
          stroke="#a96653"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M123 129h14m30 0h13"
          stroke="#284b40"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M119 211c-17 48-8 64 15 66m52-64c14 31 12 44-3 52"
          fill="none"
          stroke="#284b40"
          strokeWidth="5"
        />
        <circle
          cx="178"
          cy="269"
          r="10"
          fill="#d2ded7"
          stroke="#284b40"
          strokeWidth="4"
        />
        <rect x="201" y="249" width="24" height="30" rx="4" fill="#e5eee8" />
        <path d="M213 254v17m-7-9h14" stroke="#2d8475" strokeWidth="3" />
      </svg>
      <span className="art-plus plus-one">+</span>
      <span className="art-plus plus-two">+</span>
      <div className="art-bubble">
        <span>
          <FiHeart />
        </span>
        <div>
          <strong>Here for you</strong>
          <small>At every step.</small>
        </div>
      </div>
      <div className="art-check">
        <FiCheck />
      </div>
    </div>
  );
}
const tips = [
  {
    tag: "A LITTLE REMINDER",
    title: "Your health deserves a place on your calendar.",
    text: "Make regular checkups part of your routine. A small step today can make a meaningful difference.",
  },
  {
    tag: "BEFORE YOUR VISIT",
    title: "A little preparation. A better conversation.",
    text: "Bring your previous reports and a list of questions to make the most of your appointment.",
  },
  {
    tag: "CARE, YOUR WAY",
    title: "The right specialist is a good place to start.",
    text: "Explore our services and find the care that fits your needs, all in one place.",
  },
];
export default function Dashboard() {
  const user = useSelector((s) => s.user);
  const appointments = useSelector((s) => s.appointments);
  const appointmentsLoading = useSelector((s) => s.appointmentsLoading);
  const appointmentsError = useSelector((s) => s.appointmentsError);
  const services = useSelector((s) => s.services);
  const catalogError = useSelector((s) => s.catalogError);
  const dispatch = useDispatch();
  const [tip, setTip] = useState(0);
  useEffect(() => {
    dispatch(loadAppointments());
  }, [dispatch]);
  const upcoming = appointments
    .filter((a) => statusOf(a) === "upcoming")
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const past = appointments.filter((a) => statusOf(a) === "past");
  const reports = appointments.reduce(
    (n, a) => n + (a.reportIds?.length || 0),
    0,
  );
  const current = tips[tip];
  return (
    <div className="dashboard">
      <PageTitle
        title={"Hello, " + user.name.split(" ")[0] + " 👋"}
        description="A little attention today. A healthier tomorrow."
      >
        <span className="today-label">
          <FiCalendar />
          {new Date().toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
      </PageTitle>
      <section className="hero-banner">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span /> GOOD HEALTH STARTS HERE
          </span>
          <h2>
            Your health,
            <br />
            in good hands.
          </h2>
          <p>
            Thoughtful care. Trusted specialists.
            <br />
            Your next step to feeling better starts here.
          </p>
          <Link to="/book" className="btn primary">
            Book an appointment <FiArrowUpRight />
          </Link>
          <div className="hero-footnote">
            <FiCheckCircle /> Simple booking. Personal care.
          </div>
        </div>
        <CareIllustration />
      </section>
      <div className="stats-grid">
        {[
          [
            FiCalendar,
            "Upcoming appointments",
            upcoming.length,
            "Your next steps to better health",
            "mint",
          ],
          [
            FiCheckCircle,
            "Past visits",
            past.length,
            "Your care journey, in one place",
            "lavender",
          ],
          [
            FiFileText,
            "Uploaded reports",
            reports,
            "Ready for your next consultation",
            "peach",
          ],
        ].map(([Icon, label, value, sub, color]) => (
          <Link to="/appointments" className="stat-card" key={label}>
            <span className={"stat-icon " + color}>
              <Icon />
            </span>
            <div>
              <span className="stat-label">{label}</span>
              <strong>
                {appointmentsLoading ? "—" : String(value).padStart(2, "0")}
              </strong>
              <small>{sub}</small>
            </div>
            <FiArrowUpRight className="stat-arrow" />
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section>
          <div className="section-heading">
            <h2>
              Your next appointment{" "}
              <span className="count">{upcoming.length}</span>
            </h2>
            <Link to="/appointments">
              View all <FiArrowRight />
            </Link>
          </div>
          <ErrorBox
            message={appointmentsError}
            onRetry={() => dispatch(loadAppointments())}
          />
          {appointmentsLoading ? (
            <div className="panel loading-panel">
              Loading your appointments…
            </div>
          ) : upcoming.length ? (
            <AppointmentCard appointment={upcoming[0]} compact />
          ) : (
            !appointmentsError && (
              <div className="panel">
                <EmptyState
                  title="Your next chapter of care"
                  description="Book your first appointment when you’re ready."
                  action
                />
              </div>
            )
          )}
          <div className="section-heading services-heading">
            <h2>Care for every part of you</h2>
            <Link to="/services">
              All services <FiArrowRight />
            </Link>
          </div>
          <ErrorBox
            message={catalogError}
            onRetry={() => dispatch(loadCatalog())}
          />
          <div className="quick-services">
            {services.slice(0, 4).map((s) => (
              <Link
                key={s.id}
                to={"/book?specialty=" + encodeURIComponent(s.specialty)}
              >
                <span>
                  <ServiceIcon name={s.icon} />
                </span>
                <strong>{s.name}</strong>
                <small>
                  Explore care <FiArrowUpRight />
                </small>
              </Link>
            ))}
          </div>
        </section>
        <aside className="wellness-card">
          <div className="wellness-top">
            <span className="eyebrow">WELLNESS CORNER</span>
            <span className="wellness-flower">✳</span>
          </div>
          <span className="tip-tag">{current.tag}</span>
          <h3>{current.title}</h3>
          <p>{current.text}</p>
          <div className="carousel-controls">
            <div className="carousel-dots">
              {tips.map((_, i) => (
                <button
                  key={i}
                  className={tip === i ? "selected" : ""}
                  aria-label={"Show wellness tip " + (i + 1)}
                  aria-pressed={tip === i}
                  onClick={() => setTip(i)}
                />
              ))}
            </div>
            <div>
              <button
                aria-label="Previous tip"
                onClick={() => setTip((tip + 2) % 3)}
              >
                <FiChevronLeft />
              </button>
              <button
                aria-label="Next tip"
                onClick={() => setTip((tip + 1) % 3)}
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </aside>
      </div>
      <div className="bottom-note">
        <FiHeart />
        <p>
          Taking care of yourself is always a good idea.{" "}
          <strong>We’re glad you’re here.</strong>
        </p>
      </div>
    </div>
  );
}
