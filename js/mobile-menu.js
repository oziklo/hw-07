"use strict";

(() => {
  const menu = document.querySelector("[data-menu]");
  const openButton = document.querySelector("[data-menu-open]");
  const closeButton = document.querySelector("[data-menu-close]");
  const menuLinks = document.querySelectorAll("[data-menu-link]");

  if (!(menu instanceof HTMLElement)) {
    console.error("Помилка: мобільне меню не знайдено.");
    return;
  }

  if (!(openButton instanceof HTMLButtonElement)) {
    console.error("Помилка: кнопка відкриття меню не знайдена.");
    return;
  }

  if (!(closeButton instanceof HTMLButtonElement)) {
    console.error("Помилка: кнопка закриття меню не знайдена.");
    return;
  }

  const openMenu = () => {
    menu.hidden = false;
    document.body.classList.add("menu-open");
    openButton.setAttribute("aria-expanded", "true");
    closeButton.focus();
  };

  const closeMenu = () => {
    menu.hidden = true;
    document.body.classList.remove("menu-open");
    openButton.setAttribute("aria-expanded", "false");
    openButton.focus();
  };

  const closeMenuWithoutFocus = () => {
    menu.hidden = true;
    document.body.classList.remove("menu-open");
    openButton.setAttribute("aria-expanded", "false");
  };

  openButton.addEventListener("click", openMenu);
  closeButton.addEventListener("click", closeMenu);

  menu.addEventListener("click", (event) => {
    if (event.target === menu) {
      closeMenuWithoutFocus();
    }
  });

  menuLinks.forEach((link) => {
    link.addEventListener("click", closeMenuWithoutFocus);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !menu.hidden) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 768 && !menu.hidden) {
      closeMenuWithoutFocus();
    }
  });
})();
