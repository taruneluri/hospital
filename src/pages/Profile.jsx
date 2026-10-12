import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCamera, FiCheck, FiShield, FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";
import { PageTitle, Avatar, Field, ErrorBox } from "../components/UI";
import { api, today } from "../lib/api";
import { notify } from "../store";
export default function Profile() {
  const user = useSelector((s) => s.user);
  const dispatch = useDispatch();
  const [values, setValues] = useState({
    name: user.name,
    phone: user.phone,
    dob: user.dob || "",
    gender: user.gender || "",
    bloodGroup: user.bloodGroup || "",
    address: user.address || "",
    avatar: user.avatar || "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const update = (e) =>
    setValues({ ...values, [e.target.name]: e.target.value });
  const complete = [
    values.name,
    values.phone,
    values.dob,
    values.gender,
    values.address,
  ].filter(Boolean).length;
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const updated = await api("/profile", { method: "PUT", body: values });
      dispatch({ type: "user/set", payload: updated });
      dispatch(notify("Your profile has been updated."));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function upload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 2 * 1024 * 1024
    ) {
      setError("Choose a JPG, PNG, or WebP image under 2 MB.");
      e.target.value = "";
      return;
    }
    setReading(true);
    const reader = new FileReader();
    reader.onload = () => {
      setValues((v) => ({ ...v, avatar: reader.result }));
      setReading(false);
      setError("");
    };
    reader.onerror = () => {
      setError("Unable to read this image. Try another file.");
      setReading(false);
    };
    reader.readAsDataURL(file);
  }
  return (
    <>
      <PageTitle
        eyebrow="LET’S GET TO KNOW YOU"
        title="My profile"
        description="A few details help us make your care more personal."
      />
      <div className="profile-layout">
        <aside>
          <div className="profile-summary panel">
            <div className="profile-avatar">
              <Avatar user={{ ...user, ...values }} size="large" />
              <label
                className="upload-avatar"
                aria-label="Upload profile picture"
              >
                <FiCamera />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Upload profile picture"
                  onChange={upload}
                />
              </label>
            </div>
            <h2>{values.name || user.name}</h2>
            <span className="badge upcoming">Patient</span>
            <p className="muted">{user.email}</p>
            <div className="profile-progress">
              <div>
                <strong>Your profile</strong>
                <span>{complete * 20}% complete</span>
              </div>
              <progress max="5" value={complete} />
              <small>
                A little more about you. A little more personal care.
              </small>
            </div>
          </div>
          <div className="profile-tip">
            <FiShield />
            <h3>Your details, in your hands.</h3>
            <p>
              You can update your profile whenever you need to. Your
              appointments stay connected to your account.
            </p>
            <Link to="/">
              Go to dashboard <FiArrowUpRight />
            </Link>
          </div>
        </aside>
        <form className="panel profile-form" onSubmit={submit}>
          <div className="form-section-title">
            <h2>Personal information</h2>
            <p className="muted">
              Keep your details up to date for a smoother visit.
            </p>
          </div>
          <ErrorBox message={error} />
          <div className="form-grid">
            <Field
              label="Full name *"
              name="name"
              value={values.name}
              onChange={update}
              required
              minLength={2}
              maxLength={80}
              autoComplete="name"
            />
            <Field label="Email address" value={user.email} readOnly disabled />
            <Field
              label="Phone number *"
              name="phone"
              type="tel"
              value={values.phone}
              onChange={update}
              required
              pattern="\+?[0-9 \(\)\-]{8,20}"
              autoComplete="tel"
            />
            <Field
              label="Date of birth"
              name="dob"
              type="date"
              max={today()}
              value={values.dob}
              onChange={update}
            />
            <Field label="Gender">
              <select name="gender" value={values.gender} onChange={update}>
                <option value="">Select gender</option>
                {["Female", "Male", "Non-binary", "Prefer not to say"].map(
                  (g) => (
                    <option key={g}>{g}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Blood group">
              <select
                name="bloodGroup"
                value={values.bloodGroup}
                onChange={update}
              >
                <option value="">Select blood group</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </Field>
            <div className="span-2">
              <Field label="Address">
                <textarea
                  name="address"
                  rows="3"
                  value={values.address}
                  onChange={update}
                  maxLength={300}
                  placeholder="Your street, city, and postal code"
                  autoComplete="street-address"
                />
              </Field>
            </div>
          </div>
          <div className="form-footer">
            <small>
              Profile photo: JPG, PNG, or WebP · Up to 2 MB
              <br />
              Photo changes are saved with your profile.
            </small>
            <button disabled={busy || reading} className="btn primary">
              {busy ? "Saving…" : reading ? "Reading image…" : "Save changes"}
              <FiCheck />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
