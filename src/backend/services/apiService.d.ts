declare module "../../backend/services/apiService.js" {
    export function postRequest(url: string, body: any): Promise<any>;
} 