document.addEventListener("DOMContentLoaded", () => {
  const dashboards = {
    freelance: {
      name: "Freelancers",
      url: "https://unike0dd.github.io/freelance/",
    },
    independentHR: {
      name: "Independent HR",
      url: "https://unike0dd.github.io/independentHR/",
    },
    hrpro: {
      name: "HR Professional",
      url: "https://unike0dd.github.io/hrpro/",
    },
    smb: {
      name: "Growing SMBs",
      url: "https://unike0dd.github.io/smb/",
    },
    consumer: {
      name: "Talent",
      url: "https://unike0dd.github.io/consumer/",
    },
  };

  const params = new URLSearchParams(window.location.search);
  const destination = dashboards[params.get("dashboard")];
  const form = document.querySelector("#auth-form");
  const signinTab = document.querySelector("#signin-tab");
  const signupTab = document.querySelector("#signup-tab");
  const nameField = document.querySelector("#name-field");
  const fullName = document.querySelector("#full-name");
  const password = document.querySelector("#password");
  const signinOptions = document.querySelector("#signin-options");
  const title = document.querySelector("#auth-title");
  const description = document.querySelector("#auth-description");
  const submitLabel = document.querySelector("#submit-label");
  const formNote = document.querySelector("#form-note");
  let mode = params.get("mode") === "signup" ? "signup" : "signin";

  if (destination) {
    document.querySelector("#dashboard-name").textContent = destination.name;
    document.querySelector("#dashboard-destination").hidden = false;
    document.title = `Sign in to ${destination.name} | Gabo Services`;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === "signup";

    signinTab.classList.toggle("active", !isSignup);
    signinTab.setAttribute("aria-selected", String(!isSignup));
    signupTab.classList.toggle("active", isSignup);
    signupTab.setAttribute("aria-selected", String(isSignup));
    nameField.hidden = !isSignup;
    fullName.required = isSignup;
    password.autocomplete = isSignup ? "new-password" : "current-password";
    signinOptions.hidden = isSignup;
    title.textContent = isSignup ? "Create your account." : "Welcome back.";
    description.textContent = isSignup
      ? "Set up your Gabo Services account to access your workspace."
      : "Sign in to continue to your Gabo Services workspace.";
    submitLabel.textContent = isSignup ? "Create account" : "Sign in";
    formNote.textContent = destination
      ? `You will continue to ${destination.name} after ${isSignup ? "creating your account" : "signing in"}.`
      : "You can choose a dashboard after accessing your account.";
  }

  signinTab.addEventListener("click", () => setMode("signin"));
  signupTab.addEventListener("click", () => setMode("signup"));

  [signinTab, signupTab].forEach((tab, index, tabs) => {
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const nextIndex = event.key === "ArrowRight" ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    if (destination) {
      window.location.assign(destination.url);
      return;
    }

    window.location.assign("index.html#plans");
  });

  setMode(mode);
});
