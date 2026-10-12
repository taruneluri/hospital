export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch("/api" + path, {
      credentials: "include",
      ...options,
      headers: isForm
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
      body: options.body
        ? isForm
          ? options.body
          : JSON.stringify(options.body)
        : undefined,
    });
  } catch {
    throw new Error(
      "Cannot reach Carewell. Check your connection and try again.",
    );
  }
  const data = await response
    .json()
    .catch(() => ({ message: "The server is unavailable. Please try again." }));
  if (!response.ok) {
    const error = new Error(data.message || "Something went wrong.");
    error.status = response.status;
    throw error;
  }
  return data;
}
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const appointmentTime = (a) =>
  new Date(a.date + "T" + a.time + ":00+05:30");
export const statusOf = (a) =>
  a.status === "cancelled"
    ? "cancelled"
    : appointmentTime(a) < new Date()
      ? "past"
      : "upcoming";
export const prettyDate = (date) =>
  new Date(date + "T12:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
export const prettyTime = (time) =>
  new Date("2000-01-01T" + time).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
