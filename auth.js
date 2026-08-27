import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  getIdTokenResult,
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

function safeDashboardReturnUrl(value, destination) {
  if (!value || !destination) return null;

  try {
    const candidate = new URL(value, window.location.origin);
    const dashboardRoot = new URL(destination.url);

    if (
      candidate.origin !== dashboardRoot.origin ||
      !candidate.pathname.startsWith(dashboardRoot.pathname)
    ) {
      return null;
    }

    return candidate.href;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const destinationKey = params.get("dashboard");
  const destination = dashboards[destinationKey];
  const returnUrl = safeDashboardReturnUrl(params.get("returnTo"), destination);
  const redirectReason = params.get("reason");
  const form = document.querySelector("#auth-form");
  const signinTab = document.querySelector("#signin-tab");
  const signupTab = document.querySelector("#signup-tab");
  const nameField = document.querySelector("#name-field");
  const fullName = document.querySelector("#full-name");
  const accountTypeField = document.querySelector("#account-type-field");
  const accountType = document.querySelector("#account-type");
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
  const resendVerification = document.querySelector("#resend-verification");
  let mode = params.get("mode") === "signup" ? "signup" : "signin";
  let auth;

  if (
    !form ||
    !signinTab ||
    !signupTab ||
    !nameField ||
    !fullName ||
    !accountTypeField ||
    !accountType ||
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
    !forgotPassword ||
    !resendVerification
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
    accountType.value = destinationKey;
    accountType.required = false;
    accountTypeField.hidden = true;
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
    accountType.disabled = busy || Boolean(destination);
    resendVerification.disabled = busy;
    submitButton.setAttribute("aria-busy", String(busy));
  }

  function setStatus(message, isError = false) {
    formNote.textContent = message;
    formNote.dataset.status = isError ? "error" : "info";
  }

  async function sendVerificationForUser(user) {
    if (user.emailVerified) {
      await signOut(auth);
      setStatus(
        "This email address is already verified. You may sign in normally.",
      );
      return;
    }

    try {
      await sendEmailVerification(user, {
        url: verificationContinueUrl(),
        handleCodeInApp: false,
      });
    } catch (verificationError) {
      console.error("Email-verification resend failed.", verificationError);
      await signOut(auth);
      setStatus(
        "We could not resend the verification email right now. Wait a few minutes and try again.",
        true,
      );
      return;
    }

    await signOut(auth);
    setStatus(
      "Verification email sent again. Check your Inbox, Spam, Junk, and Promotions folders, then use the verification link before signing in.",
    );
  }

  function selectedDestination() {
    return destination || dashboards[accountType.value] || null;
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
        : selectedDestination()
          ? `You will continue to ${selectedDestination().name} after signing in.`
          : "Select the account workspace assigned to this email address.",
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

  resendVerification.addEventListener("click", async () => {
    const address = email.value.trim().toLowerCase();
    const secret = password.value;

    if (!address || !email.checkValidity() || !secret) {
      setStatus(
        "Enter your email and password before requesting another verification email.",
        true,
      );
      (address && email.checkValidity() ? password : email).focus();
      return;
    }

    setBusy(true);
    try {
      await setPersistence(auth, browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(
        auth,
        address,
        secret,
      );
      await sendVerificationForUser(credential.user);
    } catch (error) {
      console.error("Verification resend authentication failed.", error);
      setStatus(
        "We could not verify the account credentials or resend the email. Check the information and try again.",
        true,
      );
    } finally {
      setBusy(false);
      password.value = "";
    }
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
    const activeDestination = selectedDestination();

    if (!activeDestination) {
      setStatus("Select the account workspace assigned to this email address.", true);
      accountType.focus();
      return;
    }

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
          "Account created. Check your inbox, verify your email, and wait for workspace activation before signing in.",
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
        await sendVerificationForUser(credential.user);
        return;
      }

      let claims;
      try {
        claims = (await getIdTokenResult(credential.user, true)).claims;
      } catch (authorizationError) {
        console.error("Workspace authorization check failed.", authorizationError);
        await signOut(auth);
        setStatus(
          "We verified your credentials, but workspace authorization is temporarily unavailable. Please try again.",
          true,
        );
        return;
      }

      if (
        claims.account_type !== accountType.value ||
        claims.account_status !== "active"
      ) {
        await signOut(auth);
        setStatus(
          "Your email is verified, but this account has not yet been activated for the selected workspace.",
          true,
        );
        return;
      }

      window.location.assign(returnUrl || activeDestination.url);
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

  accountType.addEventListener("change", () => setMode(mode));

  setMode(mode);

  const reasonMessages = {
    "account-not-authorized":
      "Your credentials are valid, but this account has not yet been activated for the selected workspace.",
    "email-verification-required":
      "Verify your email address before accessing this workspace.",
    "authorization-unavailable":
      "Account authorization is temporarily unavailable. Please try again.",
    "authentication-required":
      "Sign in to continue to the selected workspace.",
    "signed-out":
      "You have signed out securely.",
  };
  if (redirectReason && reasonMessages[redirectReason]) {
    setStatus(reasonMessages[redirectReason], redirectReason !== "signed-out");
  }
});
