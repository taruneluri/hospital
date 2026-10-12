import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  FiArrowUpRight,
  FiEye,
  FiEyeOff,
  FiShield,
  FiCheck,
} from "react-icons/fi";
import { authenticate } from "../store";
import { Logo, Field, ErrorBox } from "../components/UI";
import { CareIllustration } from "./Dashboard";
export default function Auth({ signup = false }) {
  const [values, setValues] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((s) => s.user);
  const demo = useSelector((s) => s.demo);
  if (user) return <Navigate to="/profile" replace />;
  const update = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await dispatch(authenticate(signup ? "signup" : "login", values));
      navigate("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function demoLogin() {
    setError("");
    setBusy(true);
    try {
      await dispatch(
        authenticate("login", {
          email: "alex@carewell.demo",
          password: "Carewell123",
        }),
      );
      navigate("/profile");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-story">
        <Logo />
        <div className="auth-story-copy">
          <span className="eyebrow">CARE THAT FEELS PERSONAL</span>
          <h1>
            A healthier you.
            <br />A simpler way.
          </h1>
          <p>
            Good care starts with a connection.
            <br />
            Find yours at Carewell.
          </p>
          <CareIllustration />
        </div>
        <div className="auth-story-footer">
          <FiShield /> Thoughtful care, every step of the way.
        </div>
      </section>
      <main className="auth-main" id="main-content">
        <div className="auth-form-wrap">
          <span className="eyebrow">YOUR HEALTH. YOUR SPACE.</span>
          <h1>{signup ? "Start your care journey." : "Welcome back."}</h1>
          <p className="muted">
            {signup
              ? "Create your patient account. We’ll take it from here."
              : "Log in to make a little room for your wellbeing."}
          </p>
          <form onSubmit={submit} className="auth-form">
            <ErrorBox message={error} />
            {signup && (
              <Field
                label="Full name"
                name="name"
                autoComplete="name"
                value={values.name}
                onChange={update}
                placeholder="Your full name"
                required
                minLength={2}
                maxLength={80}
              />
            )}
            <Field
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={update}
              placeholder="you@example.com"
              required
              maxLength={254}
            />
            {signup && (
              <Field
                label="Phone number"
                name="phone"
                type="tel"
                autoComplete="tel"
                value={values.phone}
                onChange={update}
                placeholder="+91 98765 43210"
                pattern="\+?[0-9 \(\)\-]{8,20}"
                required
              />
            )}
            <label className="field">
              <span>Password</span>
              <div className="password-input">
                <input
                  name="password"
                  type={show ? "text" : "password"}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={values.password}
                  onChange={update}
                  placeholder={
                    signup ? "Create a strong password" : "Enter your password"
                  }
                  required
                  minLength={signup ? 8 : 1}
                  maxLength={72}
                  pattern={
                    signup ? "(?=.*[a-zA-Z])(?=.*[0-9]).{8,72}" : undefined
                  }
                />
                <button
                  type="button"
                  aria-label={show ? "Hide password" : "Show password"}
                  onClick={() => setShow(!show)}
                >
                  {show ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              {signup && (
                <small>
                  At least 8 characters, including a letter and a number.
                </small>
              )}
            </label>
            <button className="btn primary full-width" disabled={busy}>
              {busy ? "Please wait…" : signup ? "Create account" : "Log in"}
              <FiArrowUpRight />
            </button>
          </form>
          <p className="auth-switch">
            {signup ? "Already part of Carewell?" : "New to Carewell?"}{" "}
            <Link
              to={signup ? "/login" : "/signup"}
              onClick={() => setError("")}
            >
              {signup ? "Log in" : "Create an account"}
            </Link>
          </p>
          {demo && (
            <div className="demo-login">
              <strong>Take a look around</strong>
              <p>
                Explore a fictional patient account. Demo data resets on
                restart.
              </p>
              <button
                disabled={busy}
                className="btn secondary full-width"
                onClick={demoLogin}
              >
                Explore the demo <FiArrowUpRight />
              </button>
            </div>
          )}
          <div className="auth-reassurance">
            <FiCheck /> Your next appointment is a few clicks away.
          </div>
        </div>
        <span className="auth-copyright">
          © {new Date().getFullYear()} Carewell · Student project
        </span>
      </main>
    </div>
  );
}
