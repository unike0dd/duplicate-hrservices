import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "__FIREBASE_WEB_API_KEY__",
  authDomain: "gabo-service.firebaseapp.com",
  projectId: "gabo-service",
  storageBucket: "gabo-service.firebasestorage.app",
  messagingSenderId: "397025942439",
  appId: "1:397025942439:web:4cc0abc537ca63e0213482",
};

const dashboards = Object.freeze({
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
});

const PASSWORD_REQUIREMENTS =
  "Use 16–128 characters with uppercase, lowercase, a number, and a special character.";

function passwordIsValid(value) {
  return (
    value.length >= 16 &&
    value.length <= 128 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value)
  );
}

function verificationContinueUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", "signin");
  url.hash = "";
  return url.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const destination = dashboards[params.get("dashboard")];
  const form = document.querySelector("#auth-form");
  const signinTab = document.querySelector("#signin-tab");
  const signupTab = document.querySelector("#signup-tab");
  const nameField = document.querySelector("#name-field");
  const fullName = document.querySelector("#full-name");
  const email = document.querySelector("#email");
  const password = document.querySelector("#password");
  const remember = form?.querySelector('input[name="remember"]');
  const submitButton = form?.querySelector('button[type="submit"]');
  const signinOptions = document.querySelector("#signin-options");
  const title = document.querySelector("#auth-title");
  const description = document.querySelector("#auth-description");
  const submitLabel = document.querySelector("#submit-label");
  const formNote = document.querySelector("#form-note");
  const authProviders = document.querySelector("#auth-providers");
  const authDivider = document.querySelector("#auth-divider");
  const accountRecovery = document.querySelector("#account-recovery");
  const forgotPassword = document.querySelector("#forgot-password");
  let mode = params.get("mode") === "signup" ? "signup" : "signin";
  let auth;

  if (
    !form ||
    !signinTab ||
    !signupTab ||
    !nameField ||
    !fullName ||
    !email ||
    !password ||
    !submitButton ||
    !signinOptions ||
    !title ||
    !description ||
    !submitLabel ||
    !formNote ||
    !authProviders ||
    !authDivider ||
    !accountRecovery ||
    !forgotPassword
  ) {
    return;
  }

  try {
    auth = getAuth(initializeApp(firebaseConfig));
  } catch (error) {
    console.error("Firebase initialization failed.", error);
    submitButton.disabled = true;
    formNote.textContent =
      "Account access is temporarily unavailable. Please try again later.";
    return;
  }

  if (destination) {
    document.querySelector("#dashboard-name").textContent = destination.name;
    document.querySelector("#dashboard-destination").hidden = false;
    document.title = `Sign in to ${destination.name} | Gabo Services`;
  }

  function setBusy(busy) {
    submitButton.disabled = busy;
    signinTab.disabled = busy;
    signupTab.disabled = busy;
    email.readOnly = busy;
    password.readOnly = busy;
    fullName.readOnly = busy;
    submitButton.setAttribute("aria-busy", String(busy));
  }

  function setStatus(message, isError = false) {
    formNote.textContent = message;
    formNote.dataset.status = isError ? "error" : "info";
  }

  function setMode(nextMode, focusPanel = false) {
    mode = nextMode;
    const isSignup = mode === "signup";

    signinTab.classList.toggle("active", !isSignup);
    signinTab.setAttribute("aria-selected", String(!isSignup));
    signinTab.tabIndex = isSignup ? -1 : 0;

    signupTab.classList.toggle("active", isSignup);
    signupTab.setAttribute("aria-selected", String(isSignup));
    signupTab.tabIndex = isSignup ? 0 : -1;

    nameField.hidden = !isSignup;
    fullName.required = isSignup;
    password.autocomplete = isSignup ? "new-password" : "current-password";
    password.minLength = isSignup ? 16 : 1;
    password.maxLength = 128;
    password.placeholder = isSignup
      ? "16–128 characters"
      : "Enter your password";
    signinOptions.hidden = isSignup;
    authProviders.hidden = isSignup;
    authDivider.hidden = isSignup;
    accountRecovery.hidden = isSignup;

    title.textContent = isSignup ? "Create your account." : "Welcome back.";
    description.textContent = isSignup
      ? "Set up your Gabo Services account to access your workspace."
      : "Sign in to continue to your Gabo Services workspace.";
    submitLabel.textContent = isSignup ? "Create account" : "Sign in";
    setStatus(
      isSignup
        ? PASSWORD_REQUIREMENTS
        : destination
          ? `You will continue to ${destination.name} after signing in.`
          : "You can choose a dashboard after accessing your account.",
    );

    if (focusPanel) {
      (isSignup ? fullName : email).focus();
    }
  }

  signinTab.addEventListener("click", () => setMode("signin"));
  signupTab.addEventListener("click", () => setMode("signup"));

  [signinTab, signupTab].forEach((tab, index, tabs) => {
    tab.addEventListener("keydown", (event) => {
      const handledKeys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!handledKeys.includes(event.key)) return;

      event.preventDefault();
      let nextIndex = index;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
      if (event.key === "ArrowLeft") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      }
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = tabs.length - 1;

      tabs[nextIndex].focus();
      setMode(tabs[nextIndex] === signupTab ? "signup" : "signin");
    });
  });

  document.querySelectorAll(".auth-provider").forEach((provider) => {
    provider.addEventListener("click", () => {
      setStatus(
        `${provider.dataset.provider} sign-in is not yet available. Please continue with your email address.`,
      );
      email.focus();
    });
  });

  forgotPassword.addEventListener("click", async (event) => {
    event.preventDefault();
    const address = email.value.trim().toLowerCase();
    if (!address || !email.checkValidity()) {
      setStatus("Enter your email address before requesting a password reset.", true);
      email.focus();
      return;
    }

    try {
      forgotPassword.setAttribute("aria-disabled", "true");
      await sendPasswordResetEmail(auth, address, {
        url: verificationContinueUrl(),
        handleCodeInApp: false,
      });
    } catch (error) {
      console.error("Password-reset request failed.", error);
    } finally {
      forgotPassword.removeAttribute("aria-disabled");
    }

    setStatus(
      "If an eligible account matches that address, Firebase will send password-reset instructions.",
    );
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const address = email.value.trim().toLowerCase();
    const secret = password.value;

    if (mode === "signup" && !passwordIsValid(secret)) {
      setStatus(PASSWORD_REQUIREMENTS, true);
      password.focus();
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const credential = await createUserWithEmailAndPassword(
          auth,
          address,
          secret,
        );
        const displayName = fullName.value.trim().slice(0, 100);
        if (displayName) {
          await updateProfile(credential.user, { displayName });
        }
        await sendEmailVerification(credential.user, {
          url: verificationContinueUrl(),
          handleCodeInApp: false,
        });
        await signOut(auth);
        form.reset();
        setMode("signin");
        setStatus(
          "Account created. Check your inbox and verify your email before signing in.",
        );
        return;
      }

      await setPersistence(
        auth,
        remember?.checked
          ? browserLocalPersistence
          : browserSessionPersistence,
      );
      const credential = await signInWithEmailAndPassword(auth, address, secret);

      if (!credential.user.emailVerified) {
        await signOut(auth);
        setStatus(
          "Verify your email address before accessing a workspace.",
          true,
        );
        return;
      }

      if (destination) {
        window.location.assign(destination.url);
        return;
      }
      window.location.assign("index.html#plans");
    } catch (error) {
      console.error("Authentication request failed.", error);
      setStatus(
        mode === "signup"
          ? "We could not create the account. Check the information and try again."
          : "Sign-in failed. Check your credentials and account status, then try again.",
        true,
      );
    } finally {
      setBusy(false);
      password.value = "";
    }
  });

  setMode(mode);
});
