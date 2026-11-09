"use strict";
/* The shared scoring module is an ES module; load it once from CommonJS. */
let p = null;
module.exports = () => p || (p = import("../../shared/skills.mjs"));
