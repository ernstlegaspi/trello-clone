export interface RegisterBody {
  name: string;
  email: string;
  password: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PublicAuthUser {
  id: string;
  name: string;
  email: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
