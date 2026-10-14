const productImage = document.querySelector("#product-image");
const viewButtons = document.querySelectorAll(".view-button");
const openPurchaseButton = document.querySelector("#open-purchase");
const purchaseView = document.querySelector("#purchase-view");
const closePurchaseButton = document.querySelector("#close-purchase");
const purchaseForm = document.querySelector("#purchase-form");
const submitPurchaseButton = document.querySelector("#submit-purchase");
const statusMessage = document.querySelector("#form-status");
const sizeInput = document.querySelector("#size");
const phoneInput = document.querySelector("#phone");
const enrollmentInput = document.querySelector("#enrollment-no");

const APPS_SCRIPT_ENDPOINT = import.meta.env?.VITE_APPS_SCRIPT_ENDPOINT;

const keepDigitsOnly = (input, maxLength) => {
  const digitsOnly = input.value.replace(/\D/g, "").slice(0, maxLength);
  if (input.value !== digitsOnly) input.value = digitsOnly;
};

phoneInput.addEventListener("input", () => keepDigitsOnly(phoneInput, 10));
enrollmentInput.addEventListener("input", () => {
  const enrollment = enrollmentInput.value
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 10)
    .toUpperCase();

  if (enrollmentInput.value !== enrollment) enrollmentInput.value = enrollment;
});

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    productImage.src = button.dataset.image;
    productImage.alt = button.dataset.alt;
  });
});

document.querySelectorAll("[data-size]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-size]").forEach((item) => item.classList.remove("is-selected"));
    button.classList.add("is-selected");
    sizeInput.value = button.dataset.size;
  });
});

const setStatus = (message, state = "") => {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
};

purchaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!sizeInput.value) {
    setStatus("Please choose a size.", "error");
    return;
  }

  if (!purchaseForm.reportValidity()) return;

  submitPurchaseButton.disabled = true;
  setStatus("Submitting your details…", "pending");

  try {
    if (!APPS_SCRIPT_ENDPOINT) {
      throw new Error("The Apps Script endpoint is not configured.");
    }

    const formData = new FormData(purchaseForm);
    const payload = {
      fullName: formData.get("fullName").trim(),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      size: formData.get("size"),
      enrollmentNo: formData.get("enrollmentNo").trim()
    };

    // Apps Script web apps do not expose CORS headers by default. The plain-text
    // request still reaches doPost, while no-cors prevents the browser from
    // blocking the cross-origin submission.
    await fetch(APPS_SCRIPT_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });

    setStatus("Registration submitted successfully.", "success");
    purchaseForm.reset();
    sizeInput.value = "";
    document.querySelectorAll("[data-size]").forEach((item) => item.classList.remove("is-selected"));
  } catch (error) {
    setStatus("Could not submit right now. Please check your connection and try again.", "error");
  } finally {
    submitPurchaseButton.disabled = false;
  }
});

const closePurchaseView = () => {
  purchaseView.hidden = true;
  document.body.classList.remove("purchase-open");
};

closePurchaseButton.addEventListener("click", closePurchaseView);

openPurchaseButton.addEventListener("click", () => {
  purchaseView.hidden = false;
  document.body.classList.add("purchase-open");
  purchaseView.scrollTop = 0;
});

purchaseView.addEventListener("click", (event) => {
  if (event.target === purchaseView) closePurchaseView();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !purchaseView.hidden) closePurchaseView();
});
