import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { createStore, applyMiddleware } from "redux";
import { thunk } from "redux-thunk";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import Auth from "./Auth";
import Book from "./Book";
import Appointments from "./Appointments";
import Services from "./Services";
const doctors = [
  {
    id: "ananya",
    name: "Dr. Ananya Sharma",
    specialty: "General Physician",
    experience: 12,
    fee: 600,
    initials: "AS",
  },
];
const base = {
  user: null,
  demo: false,
  doctors,
  services: [],
  catalogError: null,
  appointments: [],
  appointmentsLoading: false,
};
function mount(component, state = {}) {
  const store = createStore(
    (s = { ...base, ...state }, a) =>
      a.type === "appointments/set" ? { ...s, appointments: a.payload } : s,
    applyMiddleware(thunk),
  );
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <Routes>
          <Route path="/" element={component} />
          <Route path="/profile" element={<h1>Patient profile</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}
beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  window.scrollTo = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
const ok = (data) => ({ ok: true, json: async () => data });
describe("patient interface", () => {
  it("shows a failed login message and allows password visibility", async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: "Email or password is incorrect." }),
    });
    mount(<Auth />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email address"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "WrongPass123");
    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email or password is incorrect.",
    );
  });
  it("navigates successful login to the profile page", async () => {
    fetch.mockResolvedValue(ok({ name: "Alex", email: "alex@example.com" }));
    mount(<Auth />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Email address"), "alex@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPass123");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(
      await screen.findByRole("heading", { name: "Patient profile" }),
    ).toBeInTheDocument();
  });
  it("requires doctor, date, and time, then submits a real multipart booking", async () => {
    fetch.mockImplementation(async (url, options) =>
      url.includes("availability")
        ? ok(["09:00", "10:00"])
        : options?.method === "POST"
          ? ok({ _id: "one", date: "2030-01-03", time: "09:00" })
          : ok([]),
    );
    mount(<Book />);
    const user = userEvent.setup();
    expect(
      screen.getByRole("button", { name: "Confirm appointment" }),
    ).toBeDisabled();
    await user.click(screen.getByRole("button", { name: /Dr. Ananya Sharma/ }));
    const dateInput = screen.getByLabelText("Appointment date *");
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    await user.type(dateInput, tomorrow);
    await user.click(await screen.findByRole("button", { name: /9:00/i }));
    expect(
      screen.getByRole("button", { name: "Confirm appointment" }),
    ).toBeEnabled();
    await user.click(
      screen.getByRole("button", { name: "Confirm appointment" }),
    );
    expect(
      await screen.findByText("A little care is on the calendar."),
    ).toBeInTheDocument();
    const request = fetch.mock.calls.find(
      ([url, opts]) => url === "/api/appointments" && opts?.method === "POST",
    );
    expect(request[1].body).toBeInstanceOf(FormData);
    expect(request[1].body.get("doctorId")).toBe("ananya");
  });
  it("filters appointments by status and year", async () => {
    const appointments = [
      {
        _id: "a",
        doctorId: "ananya",
        date: "2099-01-03",
        time: "09:00",
        status: "confirmed",
        reportIds: [],
      },
      {
        _id: "b",
        doctorId: "ananya",
        date: "2020-02-04",
        time: "10:00",
        status: "confirmed",
        reportIds: [],
      },
    ];
    fetch.mockResolvedValue(ok(appointments));
    mount(<Appointments />, { appointments });
    const user = userEvent.setup();
    expect(screen.getByText("3 Jan 2099")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /All appointments/ }));
    await user.selectOptions(
      screen.getByLabelText("Filter appointments by year"),
      "2020",
    );
    expect(screen.getByText("4 Feb 2020")).toBeInTheDocument();
    expect(screen.queryByText("3 Jan 2099")).not.toBeInTheDocument();
  });
  it("opens and closes FAQ answers accessibly", async () => {
    mount(<Services />);
    const user = userEvent.setup();
    const toggle = screen.getByRole("button", {
      name: "Can I cancel my appointment?",
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Confirm your choice to release/)).toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });
});
