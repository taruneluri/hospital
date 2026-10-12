import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { FiArrowUpRight, FiPlus, FiMinus } from "react-icons/fi";
import { PageTitle, ServiceIcon, ErrorBox } from "../components/UI";
import { loadCatalog } from "../store";
const faqs = [
  [
    "How do I book an appointment?",
    "Choose a specialty and doctor, pick a date and available time, then add any notes or reports. Review your details and confirm. Your booking will appear in My appointments.",
  ],
  [
    "Can I cancel my appointment?",
    "Yes. Open My appointments, find an upcoming booking, and select Cancel appointment. Confirm your choice to release the time slot.",
  ],
  [
    "What should I bring to my visit?",
    "Bring your identification and any relevant prescriptions or medical reports. You can upload up to three PDF, JPG, or PNG reports when booking, with a maximum combined size of 3 MB.",
  ],
  [
    "How do consultation fees work?",
    "Each doctor’s consultation fee is displayed before you book. This project does not collect payments online; payment is due at the clinic.",
  ],
  [
    "Can I change my profile details?",
    "Go to My profile to update your name, contact number, date of birth, and other personal details. You can also upload a profile picture.",
  ],
];
export default function Services() {
  const services = useSelector((s) => s.services);
  const catalogError = useSelector((s) => s.catalogError);
  const dispatch = useDispatch();
  const [open, setOpen] = useState(0);
  return (
    <>
      <PageTitle
        eyebrow="CARE FOR EVERY PART OF YOU"
        title="Our services"
        description="The right expertise. The personal attention you deserve."
      />
      <ErrorBox
        message={catalogError}
        onRetry={() => dispatch(loadCatalog())}
      />
      <div className="service-grid">
        {services.map((s, i) => (
          <article className="service-card" key={s.id}>
            <span className={"service-icon color-" + i}>
              <ServiceIcon name={s.icon} />
            </span>
            <span className="service-number">0{i + 1}</span>
            <h2>{s.name}</h2>
            <p>{s.description}</p>
            <Link to={"/book?specialty=" + encodeURIComponent(s.specialty)}>
              Find a specialist <FiArrowUpRight />
            </Link>
          </article>
        ))}
      </div>
      <section className="faq-section">
        <div>
          <span className="eyebrow">A LITTLE CLARITY</span>
          <h2>
            Good questions.
            <br />
            Simple answers.
          </h2>
          <p className="muted">
            Everything you need to feel ready
            <br />
            for your next appointment.
          </p>
        </div>
        <div className="faq-list">
          {faqs.map(([q, a], i) => (
            <div className={"faq-item " + (open === i ? "open" : "")} key={q}>
              <h3>
                <button
                  aria-expanded={open === i}
                  aria-controls={"faq-" + i}
                  onClick={() => setOpen(open === i ? -1 : i)}
                >
                  {q}
                  {open === i ? <FiMinus /> : <FiPlus />}
                </button>
              </h3>
              <div id={"faq-" + i} hidden={open !== i}>
                <p>{a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
