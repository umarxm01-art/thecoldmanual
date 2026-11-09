"use strict";
module.exports = { readFileSync() { throw new Error("not available in the demo"); }, existsSync() { return false; }, createMongoDb() { throw new Error("not available in the demo"); } };
