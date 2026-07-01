export function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function scrollToAnchor(id: string) {
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

export function scrollToBookingForm() {
  const element = document.getElementById("top-booking-form");
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}
