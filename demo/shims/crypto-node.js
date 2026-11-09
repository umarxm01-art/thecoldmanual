"use strict";
/* Browser stand-in for the parts of Node's crypto used by the in-memory database. */
const { hex } = require("./sha256");
function randomBytes(n) { const u = new Uint8Array(n); crypto.getRandomValues(u); return { toString: () => hex(u) }; }
function randomInt(n) { const u = new Uint32Array(1); crypto.getRandomValues(u); return u[0] % n; }
module.exports = { randomBytes, randomInt };
