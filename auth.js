document.addEventListener("DOMContentLoaded", () => {
  "use strict";
  const form = document.querySelector("#auth-form");
  const tabs = [...document.querySelectorAll(".auth-tab")];
  const nameField = document.querySelector("#name-field");
  const fullName = document.querySelector("#full-name");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const toggle = document.querySelector("#password-toggle");
  const title = document.querySelector("#auth-title");
  const description = document.querySelector("#auth-description");
  const submitLabel = document.querySelector("#submit-label");
  const note = document.querySelector("#prototype-note");
  let mode = "signin";

  function clearErrors() {
    [fullName, email, password].forEach((input) => input.removeAttribute("aria-invalid"));
    ["name", "email", "password"].forEach((name) => { document.querySelector(`#${name}-error`).textContent = ""; });
  }

  function setMode(nextMode, focusForm = false) {
    mode = nextMode;
    const signup = mode === "signup";
    tabs.forEach((tab, index) => {
      const selected = (index === 1) === signup;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
    });
    nameField.hidden = !signup;
    fullName.required = signup;
    password.autocomplete = signup ? "new-password" : "current-password";
    title.textContent = signup ? "Create your account." : "Welcome back.";
    description.textContent = signup ? "Begin your Gabo Services workspace prototype." : "Sign in to continue to your Gabo Services workspace.";
    submitLabel.textContent = signup ? "Create account" : "Sign in";
    note.textContent = "Prototype only. No account data is transmitted.";
    clearErrors();
    if (focusForm) (signup ? fullName : email).focus();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => setMode(index ? "signup" : "signin"));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" || event.key === "ArrowLeft" ? 0 : 1;
      tabs[next].focus();
      setMode(next ? "signup" : "signin");
    });
  });

  toggle.addEventListener("click", () => {
    const showing = password.type === "password";
    password.type = showing ? "text" : "password";
    toggle.textContent = showing ? "Hide" : "Show";
    toggle.setAttribute("aria-pressed", String(showing));
  });

  document.querySelectorAll(".auth-provider").forEach((button) => button.addEventListener("click", () => {
    note.textContent = `${button.dataset.provider} authentication is disabled in this visual prototype.`;
  }));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors();
    let firstInvalid = null;
    const checks = mode === "signup" ? [fullName, email, password] : [email, password];
    checks.forEach((input) => {
      if (!input.validity.valid) {
        input.setAttribute("aria-invalid", "true");
        document.querySelector(`#${input === fullName ? "name" : input.id}-error`).textContent = input === password ? "Enter at least 15 characters." : `Enter a valid ${input === fullName ? "name" : "email address"}.`;
        firstInvalid ||= input;
      }
    });
    if (firstInvalid) {
      note.textContent = "Please correct the highlighted fields.";
      firstInvalid.focus();
      return;
    }
    /* PROTOTYPE ONLY: never transmit, store, authenticate, create accounts, or redirect. */
    note.textContent = "Visual prototype validated. No account data was transmitted.";
    form.reset();
  });

  setMode("signin");
});
