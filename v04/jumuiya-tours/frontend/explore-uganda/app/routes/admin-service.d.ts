declare module '~/services/admin-service' {
  export interface AdminService {
    getUsers(params: any): Promise<User[]>;
    // Define other methods and properties of the module
  }
}
