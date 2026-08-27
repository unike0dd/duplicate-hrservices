import { firebaseAuth as auth } from "../firebase-client.js";
import {
  applyActionCode,
  checkActionCode,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const copy = {
  en: {
    toggle: "ES",
    toggleLabel: "Cambiar a español",
    eyebrow: "SECURE ACCOUNT CONFIRMATION",
    pendingTitle: "Confirming your email…",
    pendingMessage: "Please keep this page open while we validate your secure verification link.",
    successTitle: "Email verified.",
    successMessage: "Your email address has been confirmed successfully. You may now continue to Consumer sign in.",
    expiredTitle: "This link has expired.",
    expiredMessage: "Return to sign in and request a new verification email.",
    invalidTitle: "We could not verify this link.",
    invalidMessage: "The verification link is invalid or has already been used. Return to sign in to check your account or request another email.",
    unsupportedTitle: "Unsupported account action.",
    unsupportedMessage: "This page can only complete email-address verification.",
    continue: "Continue to Consumer sign in",
    retry: "Return to sign in",
    security: "Gabo Services will never ask for your password through an email verification link.",
  },
  es: {
    toggle: "EN",
    toggleLabel: "Switch to English",
    eyebrow: "CONFIRMACIÓN SEGURA DE CUENTA",
    pendingTitle: "Confirmando tu correo…",
    pendingMessage: "Mantén esta página abierta mientras validamos tu enlace seguro de verificación.",
    successTitle: "Correo verificado.",
    successMessage: "Tu correo electrónico fue confirmado correctamente. Ya puedes continuar al inicio de sesión de Consumer.",
    expiredTitle: "Este enlace ha caducado.",
    expiredMessage: "Regresa al inicio de sesión y solicita un nuevo correo de verificación.",
    invalidTitle: "No pudimos verificar este enlace.",
    invalidMessage: "El enlace no es válido o ya fue utilizado. Regresa al inicio de sesión para revisar tu cuenta o solicitar otro correo.",
    unsupportedTitle: "Acción de cuenta no compatible.",
    unsupportedMessage: "Esta página solo puede completar la verificación del correo electrónico.",
    continue: "Continuar al inicio de sesión",
    retry: "Regresar al inicio de sesión",
    security: "Gabo Services nunca solicitará tu contraseña mediante un enlace de verificación de correo.",
  },
};

const elements = {
  toggle: document.querySelector("#language-toggle"),
  eyebrow: document.querySelector("#eyebrow"),
  icon: document.querySelector("#status-icon"),
  title: document.querySelector("#action-title"),
  message: document.querySelector("#action-message"),
  continueLink: document.querySelector("#continue-link"),
  retryLink: document.querySelector("#retry-link"),
  security: document.querySelector("#security-note"),
};

const params = new URLSearchParams(window.location.search);
let language = params.get("lang")?.toLowerCase().startsWith("es") ||
  (!params.has("lang") && navigator.language.toLowerCase().startsWith("es"))
  ? "es"
  : "en";
let outcome = "pending";

function render() {
  const text = copy[language];
  document.documentElement.lang = language;
  elements.toggle.textContent = text.toggle;
  elements.toggle.setAttribute("aria-label", text.toggleLabel);
  elements.eyebrow.textContent = text.eyebrow;
  elements.retryLink.textContent = text.retry;
  elements.continueLink.textContent = text.continue;
  elements.security.textContent = text.security;

  const titleKey = `${outcome}Title`;
  const messageKey = `${outcome}Message`;
  elements.title.textContent = text[titleKey];
  elements.message.textContent = text[messageKey];
}

function setOutcome(next) {
  outcome = next;
  elements.icon.className = `status-icon status-${next === "pending" ? "pending" : next === "success" ? "success" : "error"}`;
  elements.icon.replaceChildren();
  if (next === "pending") elements.icon.append(document.createElement("span"));
  elements.continueLink.hidden = next !== "success";
  render();
}

elements.toggle.addEventListener("click", () => {
  language = language === "en" ? "es" : "en";
  render();
});

async function completeEmailVerification() {
  const mode = params.get("mode");
  const code = params.get("oobCode");

  if (mode !== "verifyEmail" || !code) {
    setOutcome("unsupported");
    return;
  }

  try {
    await checkActionCode(auth, code);
    await applyActionCode(auth, code);
    setOutcome("success");
  } catch (error) {
    console.error("Email action could not be completed.", error);
    setOutcome(error?.code === "auth/expired-action-code" ? "expired" : "invalid");
  }
}

render();
completeEmailVerification();
