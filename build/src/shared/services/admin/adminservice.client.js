"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AdminServiceClient {
    adminService;
    constructor(adminService) {
        this.adminService = adminService;
    }
    build() {
        return this.adminService;
    }
}
exports.default = AdminServiceClient;
