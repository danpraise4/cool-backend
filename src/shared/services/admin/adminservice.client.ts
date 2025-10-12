import AdminService from "./adminservice";

export default class AdminServiceClient {
  constructor(private readonly adminService: AdminService) {}

  build() {
    return this.adminService;
  }
}
