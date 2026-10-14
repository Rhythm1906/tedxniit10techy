const githubPagesBase = window.location.hostname.endsWith("github.io")
  ? "/tedxniit10techy"
  : "";
const merchPath = `${githubPagesBase}/merch`;
const canonicalPath = window.location.pathname.replace(/\/+$/, "") || "/";

if (canonicalPath !== merchPath) {
  window.history.replaceState({}, "", merchPath);
}

const productModel = document.querySelector("#product-model");
const productImage = document.querySelector("#product-image");
const viewButtons = document.querySelectorAll(".view-button");
const openPurchaseButton = document.querySelector("#open-purchase");
const purchaseView = document.querySelector("#purchase-view");
const closePurchaseButton = document.querySelector("#close-purchase");
const purchaseForm = document.querySelector("#purchase-form");
const submitPurchaseButton = document.querySelector("#submit-purchase");
const statusMessage = document.querySelector("#form-status");
const sizeInput = document.querySelector("#size");
const proofInput = document.querySelector("#proof-file");
const proofLabel = document.querySelector("#proof-label");
const phoneInput = document.querySelector("#phone");
const transactionIdInput = document.querySelector("#transaction-id");

const APPS_SCRIPT_ENDPOINT = import.meta.env?.VITE_APPS_SCRIPT_ENDPOINT;

const keepDigitsOnly = (input, maxLength) => {
  const digitsOnly = input.value.replace(/\D/g, "").slice(0, maxLength);
  if (input.value !== digitsOnly) input.value = digitsOnly;
};

phoneInput.addEventListener("input", () => keepDigitsOnly(phoneInput, 10));
transactionIdInput.addEventListener("input", () => keepDigitsOnly(transactionIdInput, 12));

viewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    viewButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");

    const isFreeCam = button.dataset.view === "free";
    productModel.hidden = !isFreeCam;
    productImage.hidden = isFreeCam;

    if (isFreeCam) {
      productModel.setAttribute("camera-orbit", "0deg 75deg 105%");
      productModel.setAttribute("field-of-view", "28deg");
      return;
    }

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

proofInput.addEventListener("change", () => {
  proofLabel.textContent = proofInput.files[0]?.name || "Upload transaction proof";
});

const readFileAsBase64 = (file) => new Promise((resolve, reject) => {
  if (!file) {
    resolve("");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => resolve(String(reader.result).split(",")[1] || ""));
  reader.addEventListener("error", () => reject(new Error("The transaction proof could not be read.")));
  reader.readAsDataURL(file);
});

const setStatus = (message, state = "") => {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
};

purchaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const proofFile = proofInput.files[0];
  if (!proofFile) {
    setStatus("Please upload your transaction proof.", "error");
    proofInput.focus();
    return;
  }

  if (!purchaseForm.reportValidity()) return;
  if (!sizeInput.value) {
    setStatus("Please choose a size.", "error");
    return;
  }

  if (proofFile && proofFile.size > 5 * 1024 * 1024) {
    setStatus("Please upload a proof smaller than 5 MB.", "error");
    return;
  }

  submitPurchaseButton.disabled = true;
  setStatus("Submitting your details…", "pending");

  try {
    if (!APPS_SCRIPT_ENDPOINT) {
      throw new Error("The Apps Script endpoint is not configured.");
    }

    const formData = new FormData(purchaseForm);
    const proofBase64 = await readFileAsBase64(proofFile);
    const payload = {
      fullName: formData.get("fullName").trim(),
      phone: formData.get("phone").trim(),
      email: formData.get("email").trim(),
      size: formData.get("size"),
      transactionId: formData.get("transactionId").trim(),
      proofBase64,
      proofName: proofFile?.name || "",
      proofMimeType: proofFile?.type || ""
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

    setStatus("Details submitted. We’ll verify your payment and contact you shortly.", "success");
    purchaseForm.reset();
    sizeInput.value = "";
    proofLabel.textContent = "Upload transaction proof";
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
