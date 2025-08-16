export interface Client {
  client_id: string;
  api_key: string;
  email: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  country: string;
  education_level?: string | null;
  occupation?: string | null;
  handedness?: string | null;
}

export interface AuthResponse {
  success: boolean;
  error: string | null;
  client: Client;
}