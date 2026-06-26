"use strict";

// ЛР6: інтерактивні елементи сторінки через JavaScript.

document.addEventListener("DOMContentLoaded", () => {
  initPricingSlider();
  initContactForm();
  initModal();
  initExpandableText();
  markElementsFromJavaScript();
});

function initPricingSlider() {
  const sliderElement = document.querySelector(".pricing-swiper");

  if (!sliderElement) {
    console.warn("Слайдер не знайдено на сторінці.");
    return;
  }

  if (typeof Swiper !== "function") {
    console.warn("Бібліотека Swiper не завантажена.");
    return;
  }

  new Swiper(sliderElement, {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: false,
  rewind: true,
  keyboard: {
    enabled: true,
  },
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
});
}

function initContactForm() {
  const form = document.querySelector("[data-contact-form]");
  const storageKey = "britlexContactRequests";
  const requests = readSavedRequests(storageKey);

  if (!(form instanceof HTMLFormElement)) {
    console.warn("Форму контактів не знайдено.");
    return;
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = collectFormData(form);

    if (!formData) {
      alert("Будь ласка, заповніть усі поля форми.");
      return;
    }

    requests.push(formData);
    saveRequests(storageKey, requests);

    console.log("Масив заявок з форми:", requests);

    form.reset();
    alert("Дані форми збережено успішно.");
  });
}

function collectFormData(form) {
  const result = {};
  const elements = Array.from(form.elements);

  for (const element of elements) {
    if (
      !(element instanceof HTMLInputElement) ||
      !element.name ||
      element.disabled
    ) {
      continue;
    }

    const value = element.value.trim();

    if (!value) {
      return null;
    }

    result[element.name] = value;
  }

  return result;
}

function readSavedRequests(storageKey) {
  try {
    const savedValue = localStorage.getItem(storageKey);

    if (!savedValue) {
      return [];
    }

    const parsedValue = JSON.parse(savedValue);

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue;
  } catch (error) {
    console.error("Не вдалося прочитати дані з localStorage:", error);
    return [];
  }
}

function saveRequests(storageKey, requests) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(requests));
  } catch (error) {
    console.error("Не вдалося зберегти дані в localStorage:", error);
  }
}

function initModal() {
  const modalBackdrop = document.querySelector("[data-modal]");
  const openButtons = document.querySelectorAll("[data-modal-open]");
  const closeButtons = document.querySelectorAll("[data-modal-close]");

  if (!(modalBackdrop instanceof HTMLElement) || openButtons.length === 0) {
    console.warn("Модальне вікно або кнопки відкриття не знайдено.");
    return;
  }

  const openModal = () => {
    modalBackdrop.hidden = false;
    document.body.classList.add("modal-open");
  };

  const closeModal = () => {
    modalBackdrop.hidden = true;
    document.body.classList.remove("modal-open");
  };

  openButtons.forEach((button) => {
    button.addEventListener("click", openModal);
  });

  closeButtons.forEach((button) => {
    button.addEventListener("click", closeModal);
  });

  modalBackdrop.addEventListener("click", (event) => {
    if (event.target === modalBackdrop) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modalBackdrop.hidden) {
      closeModal();
    }
  });
}

function initExpandableText() {
  const button = document.querySelector("[data-expand-toggle]");

  if (!(button instanceof HTMLButtonElement)) {
    console.warn("Кнопку розгортання тексту не знайдено.");
    return;
  }

  const textId = button.getAttribute("aria-controls");
  const textElement = textId ? document.getElementById(textId) : null;

  if (!textElement) {
    console.warn("Текстовий блок для розгортання не знайдено.");
    return;
  }

  button.addEventListener("click", () => {
    const isExpanded = textElement.classList.toggle("is-expanded");

    button.setAttribute("aria-expanded", String(isExpanded));
    button.textContent = isExpanded ? "Show less" : "Show more";
  });
}

function markElementsFromJavaScript() {
  const aboutTextById = document.getElementById("about-text");
  const modalByClass = document.querySelector(".modal");
  const mainByTag = document.querySelector("main");
  const priceCards = document.querySelectorAll(".price-card");

  if (aboutTextById) {
    aboutTextById.dataset.jsReady = "true";
  }

  if (modalByClass) {
    modalByClass.classList.add("js-modal-ready");
  }

  if (mainByTag) {
    mainByTag.classList.add("js-page-ready");
  }

  priceCards.forEach((card) => {
    card.classList.add("js-highlight-card");
  });
}