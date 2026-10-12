import { useState } from "react";
import {
  NavLink,
  Outlet,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiGrid,
  FiCalendar,
  FiPlusCircle,
  FiHeart,
  FiUser,
  FiLogOut,
  FiMenu,
  FiX,
  FiArrowUpRight,
  FiChevronDown,
  FiShield,
} from "react-icons/fi";
import { Logo, Avatar } from "./UI";
import { logout, notify } from "../store";
const links = [
  ["/", "Overview", FiGrid],
  ["/book", "Book an appointment", FiPlusCircle],
  ["/appointments", "My appointments", FiCalendar],
  ["/services", "Our services", FiHeart],
  ["/profile", "My profile", FiUser],
];
export default function Layout() {
  const [open, setOpen] = useState(false);
  const user = useSelector((s) => s.user);
  const demo = useSelector((s) => s.demo);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  async function signout() {
    try {
      await dispatch(logout());
      navigate("/login");
    } catch (e) {
      dispatch(notify(e.message, "error"));
    }
  }
  return (
    <div className="app-shell">
      {open && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
        />
      )}
      <aside className={"sidebar " + (open ? "is-open" : "")}>
        <div className="sidebar-brand">
          <Logo />
          <button
            className="mobile-only icon-button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          >
            <FiX />
          </button>
        </div>
        <div className="workspace-label">
          <span className="green-dot" /> PATIENT PORTAL
        </div>
        <nav aria-label="Main navigation">
          {links.map(([to, label, Icon]) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                "nav-item " + (isActive ? "active" : "")
              }
            >
              <Icon />
              {label}
              {to === "/book" && <span className="nav-plus">+</span>}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-help">
          <span className="help-icon">
            <FiHeart />
          </span>
          <h3>A little care goes a long way.</h3>
          <p>Make time for your health. We’ll make the rest simple.</p>
          <Link to="/book" onClick={() => setOpen(false)}>
            Find your care <FiArrowUpRight />
          </Link>
        </div>
        <div className="sidebar-user">
          <Link to="/profile" onClick={() => setOpen(false)}>
            <Avatar user={user} />
            <span>
              <strong>{user.name}</strong>
              <small>Patient account</small>
            </span>
          </Link>
          <button
            className="icon-button"
            onClick={signout}
            aria-label="Log out"
          >
            <FiLogOut />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button menu-toggle"
              onClick={() => setOpen(!open)}
              aria-label="Toggle navigation"
              aria-expanded={open}
            >
              <FiMenu />
            </button>
            <span className="breadcrumb">
              Your workspace <span>/</span>{" "}
              <strong>
                {links.find((l) => l[0] === location.pathname)?.[1] ||
                  "Carewell"}
              </strong>
            </span>
          </div>
          <div className="topbar-right">
            <span className="secure-label">
              <FiShield /> A space for your wellbeing
            </span>
            <Link to="/profile" className="header-profile">
              <Avatar user={user} size="small" />
              <FiChevronDown />
            </Link>
          </div>
        </header>
        {demo && (
          <div className="demo-strip">
            STUDENT PROJECT DEMO{" "}
            <span>
              Fictional clinic & doctors. Data resets when the demo restarts.
            </span>
          </div>
        )}
        <main id="main-content">
          <Outlet />
        </main>
        <footer>
          <span>
            © {new Date().getFullYear()} Carewell. Care that feels personal.
          </span>
          <span>
            <FiHeart /> Made for a healthier you
          </span>
        </footer>
      </div>
    </div>
  );
}
