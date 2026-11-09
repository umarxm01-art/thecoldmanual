/* The Cold Manual sales page settings. Edit, then run `npm run build`. Anything left empty ("" or []) is hidden on the page. */
window.OSI_CFG = {
  name: "The Cold Manual",
  tagline: "Find, book and close your own US clients.",
  price: "Rs 2,700",
  priceNote: "One payment. Lifetime access to this edition, updates included. Founding price for the first 50 members only.",
  checkoutUrl: "#pay-details", /* "#pay-details" shows the manual payment details below. Put a Safepay, PayFast or Stripe link here to use online checkout instead. */

  /* Manual payment, shown when the buyer clicks the buy button. Leave a value empty to hide its line. */
  manualPay: { jazzcash: "03239865779", bank: "Allied Bank", iban: "PK80ABPA0010075293440018", accountName: "Muhammad Umar" },

  /* Payment methods your checkout really takes, shown under the buy button, e.g. ["Debit or credit card", "JazzCash", "Easypaisa", "Bank transfer"]. */
  payMethods: ["JazzCash", "Bank transfer"],

  /* WhatsApp: full international number, digits only, e.g. "923001234567".
     Turns on the floating WhatsApp button, the "pay by bank transfer, JazzCash or Easypaisa" line and the WhatsApp links in the questions. */
  whatsapp: "923136336666",
  whatsappText: "Hi, I have a question about The Cold Manual.",

  /* Founder photo: put the file in site-src/img/ and write its name, e.g. "img/umar.jpg" (portrait, about 960 x 1120). */
  founderPhoto: "img/umar.jpg",
  /* Founder video: a YouTube link (https://www.youtube.com/watch?v=... or https://youtu.be/...) or an .mp4 file in site-src/img/.
     Shows in the "Why I built this" section and adds a "Watch" link under the hero buttons. */
  founderVideo: "",
  founderVideoPoster: "",
  /* Welcome video for new members, shown on their first screen in the portal: a YouTube link, about 60 seconds on how to use it. Leave "" to hide. */
  welcomeVideo: "", /* optional still image for an .mp4, e.g. "img/umar-poster.jpg" */

  supportEmail: "support@thecoldmanual.com",
  applyUrl: "",
  refund: "Use the manual for 14 days and complete days 1 to 14 of the 30-day plan. If you've done the steps and don't like it, ask within 7 days after that and we'll refund you in full.",
  refundShort: "14-day refund if you complete the steps",
  /* Who is selling, shown on the terms and privacy pages. Add your registered business or personal name before launch. */
  legalName: "Umar M.",
  legalCity: "Islamabad, Pakistan",
  /* Honest price anchor shown under "Everything you get". Leave "" to hide. */
  anchor: "Live client-hunting programs in Pakistan charge Rs 40,000 and more. Remote closing academies abroad charge $2,000 to $8,000. One hour with Umar on a 1:1 call is Rs 10,000. The manual is the whole method, with the plan, tools and practice included.",
  /* Only a real, dated reason, e.g. "Founding member price until 30 November". Never a fake countdown. Leave "" to hide. */
  launchNote: "Founding member price: first 50 members only",
  /* Real results only, e.g. { n: "214", label: "meetings booked by members in their first 30 days" }. Hidden while empty. Never put an estimate here. */
  proof: [],
  /* Real words from real buyers, with their permission, e.g. { quote: "Booked my first meeting on day 12.", name: "Ali R.", role: "Freelance setter, Lahore" }. Hidden while empty. */
  testimonials: [],
  year: 2026
};
