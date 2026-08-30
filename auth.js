const dashboards = Object.freeze({
  freelance: "Freelancers",
  independentHR: "Independent HR",
  hrpro: "HR Professional",
  smb: "Growing SMBs",
  consumer: "Talent",
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const destinationKey = params.get("dashboard");
  const destinationName = dashboards[destinationKey];
  const form = document.querySelector("#auth-form");
  const signinTab = document.querySelector("#signin-tab");
  const signupTab = document.querySelector("#signup-tab");
  const nameField = document.querySelector("#name-field");
  const accountTypeField = document.querySelector("#account-type-field");
  const accountType = document.querySelector("#account-type");
  const title = document.querySelector("#auth-title");
  const description = document.querySelector("#auth-description");
  const submitLabel = document.querySelector("#submit-label");
  const formNote = document.querySelector("#form-note");
  const forgotPassword = document.querySelector("#forgot-password");
  const resendVerification = document.querySelector("#resend-verification");
  let mode = params.get("mode") === "signup" ? "signup" : "signin";

  if (!form || !signinTab || !signupTab || !nameField || !accountTypeField ||
      !accountType || !title || !description || !submitLabel || !formNote) return;

  if (destinationName) {
    accountType.value = destinationKey;
    accountType.required = false;
    accountTypeField.hidden = true;
    const dashboardName = document.querySelector("#dashboard-name");
    const dashboardDestination = document.querySelector("#dashboard-destination");
    if (dashboardName) dashboardName.textContent = destinationName;
    if (dashboardDestination) dashboardDestination.hidden = false;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const signingUp = mode === "signup";
    signinTab.classList.toggle("active", !signingUp);
    signupTab.classList.toggle("active", signingUp);
    signinTab.setAttribute("aria-selected", String(!signingUp));
    signupTab.setAttribute("aria-selected", String(signingUp));
    nameField.hidden = !signingUp;
    accountTypeField.hidden = !signingUp || Boolean(destinationName);
    title.textContent = signingUp ? "Create a new account" : "Welcome back";
    description.textContent = signingUp
      ? "Account registration will be available when secure services are connected."
      : "Sign-in will be available when secure services are connected.";
    submitLabel.textContent = signingUp ? "Create account" : "Sign in";
  }

  signinTab.addEventListener("click", () => setMode("signin"));
  signupTab.addEventListener("click", () => setMode("signup"));
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    formNote.dataset.status = "info";
    formNote.textContent = mode === "signup"
      ? "Account registration is not connected in this visual prototype."
      : "Sign-in is not connected in this visual prototype.";
  });

  for (const control of [forgotPassword, resendVerification]) {
    control?.addEventListener("click", (event) => {
      event.preventDefault();
      formNote.dataset.status = "info";
      formNote.textContent = "Account services are not connected in this visual prototype.";
    });
  }

  setMode(mode);
});
