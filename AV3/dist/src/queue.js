"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportQueueName = void 0;
exports.getReportQueue = getReportQueue;
const bullmq_1 = require("bullmq");
const ioredis_1 = __importDefault(require("ioredis"));
exports.reportQueueName = 'greencode-analytics-reports';
let connection;
let queue;
function getConnection() {
    if (!connection) {
        const redisUrl = process.env.REDIS_URL;
        if (!redisUrl)
            throw new Error('REDIS_URL nao configurada.');
        connection = new ioredis_1.default(redisUrl, { maxRetriesPerRequest: null });
    }
    return connection;
}
function getReportQueue() {
    if (!queue) {
        queue = new bullmq_1.Queue(exports.reportQueueName, { connection: getConnection() });
    }
    return queue;
}
