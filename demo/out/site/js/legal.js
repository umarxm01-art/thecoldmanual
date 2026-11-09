/* Fills the terms and privacy pages from the same settings as the sales page, so the refund promise and contact details stay the same everywhere. */
(function () {
  var C = window.OSI_CFG || {};
  Array.prototype.forEach.call(document.querySelectorAll("[data-cfg]"), function (el) { var v = C[el.getAttribute("data-cfg")]; if (v != null) el.textContent = String(v); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-legal-who]"), function (el) { el.textContent = C.legalName ? "run by " + C.legalName + ", " + C.legalCity : "run from " + C.legalCity; });
  var contact = C.whatsapp ? "WhatsApp +" + String(C.whatsapp).replace(/\D/g, "") + " or " + C.supportEmail : C.supportEmail;
  Array.prototype.forEach.call(document.querySelectorAll("[data-contact]"), function (el) { el.textContent = contact || ""; });
})();
