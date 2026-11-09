"use strict";
module.exports = { join: (...a) => a.join("/"), resolve: (...a) => a.join("/"), dirname: (p) => String(p).split("/").slice(0, -1).join("/") };
