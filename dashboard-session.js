import { firebaseAuth as auth } from "./firebase-client.js";
import {
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

const DASHBOARDS = Object.freeze({
  freelance: "/freelance/",
  independentHR: "/independentHR/",
  hrpro: "/hrpro/",
  smb: "/smb/",
  consumer: "/consumer/",
});

const AUTH_URL = "https://unike0dd.github.io/duplicate-hrservices/auth.html";

function dashboardContext() {
  return Object.entries(DASHBOARDS).find(([, prefix]) =>
    window.location.pathname.startsWith(prefix),
  );
}

function safeResumeLocation(value, prefix) {
  if (!value) return null;

  try {
    const candidate = new URL(value, window.location.origin);
    if (
      candidate.origin !== window.location.origin ||
      !candidate.pathname.startsWith(prefix)
    ) {
      return null;
    }

    return `${candidate.pathname}${candidate.search}${candidate.hash}`;
  } catch {
    return null;
  }
}

function resumeKey(uid, dashboard) {
  return `gabo:resume:${uid}:${dashboard}`;
}

function rememberLocation(key, prefix) {
  const location = safeResumeLocation(window.location.href, prefix);
  if (location) localStorage.setItem(key, location);
}

function redirectToSignIn(dashboard, reason) {
  const target = new URL(AUTH_URL);
  target.searchParams.set("dashboard", dashboard);
  target.searchParams.set("mode", "signin");
  if (reason) target.searchParams.set("reason", reason);
  window.location.replace(target.href);
}

function installStyles() {
  if (document.querySelector("#gabo-session-styles")) return;

  const style = document.createElement("style");
  style.id = "gabo-session-styles";
  style.textContent = `
    .gabo-session-controls {
      display: flex;
      align-items: center;
      gap: .55rem;
    }
    .gabo-session-user {
      max-width: 12rem;
      overflow: hidden;
      color: inherit;
      font: 600 .72rem/1.2 system-ui, sans-serif;
      text-overflow: ellipsis;
      white-space: nowrap;
      opacity: .78;
    }
    .gabo-logout {
      min-height: 2.4rem;
      padding: .55rem .8rem;
      border: 1px solid currentColor;
      border-radius: .65rem;
      background: transparent;
      color: inherit;
      font: 750 .76rem/1 system-ui, sans-serif;
      cursor: pointer;
    }
    .gabo-logout:hover,
    .gabo-logout:focus-visible {
      background: rgba(237, 115, 56, .15);
      outline: 3px solid rgba(237, 115, 56, .28);
      outline-offset: 2px;
    }
    .gabo-session-fallback {
      position: fixed;
      z-index: 1000;
      top: 1rem;
      right: 1rem;
      padding: .6rem;
      border: 1px solid rgba(27, 43, 56, .16);
      border-radius: .8rem;
      background: #fff;
      color: #1b2b38;
      box-shadow: 0 .5rem 1.5rem rgba(27, 43, 56, .16);
    }
    @media (max-width: 720px) {
      .gabo-session-user { display: none; }
      .gabo-session-fallback { top: .65rem; right: .65rem; }
    }
  `;
  document.head.appendChild(style);
}

async function clearGaboSessionData() {
  for (const storage of [sessionStorage, localStorage]) {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      const isResumeMarker = key?.startsWith("gabo:resume:");
      if (key?.startsWith("gabo:") && !isResumeMarker) {
        storage.removeItem(key);
      }
    }
  }

  if ("caches" in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("gabo-"))
        .map((name) => caches.delete(name)),
    );
  }
}

function installLogout(user, dashboard, prefix) {
  if (document.querySelector("#gabo-logout")) return;

  installStyles();
  const key = resumeKey(user.uid, dashboard);
  const controls = document.createElement("div");
  controls.className = "gabo-session-controls";
  controls.setAttribute("aria-label", "Account session");

  const identity = document.createElement("span");
  identity.className = "gabo-session-user";
  identity.textContent = user.email || "Signed in";

  const button = document.createElement("button");
  button.id = "gabo-logout";
  button.className = "gabo-logout";
  button.type = "button";
  button.textContent = "Log out";

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Logging out…";
    rememberLocation(key, prefix);

    try {
      await signOut(auth);
      await clearGaboSessionData();
    } finally {
      redirectToSignIn(dashboard, "signed-out");
    }
  });

  controls.append(identity, button);

  const preferredHost =
    document.querySelector(".side-bottom") ||
    document.querySelector(".top-actions") ||
    document.querySelector("header");

  if (preferredHost) {
    preferredHost.appendChild(controls);
  } else {
    controls.classList.add("gabo-session-fallback");
    document.body.appendChild(controls);
  }
}

const context = dashboardContext();

if (context) {
  const [dashboard, prefix] = context;

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      redirectToSignIn(dashboard, "authentication-required");
      return;
    }

    if (!user.emailVerified) {
      await signOut(auth);
      redirectToSignIn(dashboard, "email-verification-required");
      return;
    }

    const key = resumeKey(user.uid, dashboard);
    const saved = safeResumeLocation(localStorage.getItem(key), prefix);
    const current = safeResumeLocation(window.location.href, prefix);

    if (saved && current === prefix && saved !== prefix) {
      window.location.replace(saved);
      return;
    }

    rememberLocation(key, prefix);
    window.addEventListener("pagehide", () => rememberLocation(key, prefix));
    window.addEventListener("hashchange", () => rememberLocation(key, prefix));
    installLogout(user, dashboard, prefix);
  });
}
