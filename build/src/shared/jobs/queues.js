"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facilityQueue = exports.materialQueue = void 0;
const bullmq_1 = require("bullmq");
const catch_1 = require("./utils/catch");
exports.materialQueue = new bullmq_1.Queue("materials", { connection: catch_1.redis });
exports.facilityQueue = new bullmq_1.Queue("facilities", { connection: catch_1.redis });
