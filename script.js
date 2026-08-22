self.__VINEXT_RSC_PARAMS__ = {};

self.__VINEXT_RSC_NAV__ = {
  pathname: "/",
  searchParams: [],
};

import("/assets/index-C1I_H6U9.js");

document.addEventListener("DOMContentLoaded", () => {
  const mobileMenu = document.querySelector(".mobile-menu");

  if (!mobileMenu) {
    return;
  }

  const mobileLinks = mobileMenu.querySelectorAll("a");

  mobileLinks.forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.removeAttribute("open");
    });
  });

  document.addEventListener("click", (event) => {
    if (
      mobileMenu.hasAttribute("open") &&
      !mobileMenu.contains(event.target)
    ) {
      mobileMenu.removeAttribute("open");
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      mobileMenu.removeAttribute("open");
    }
  });
});
