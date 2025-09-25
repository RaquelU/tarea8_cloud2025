export class AuthResponse {
  status: number;
  mensaje: string;
  data: { id: number; nombre: string } | null;

  constructor(status: number, mensaje: string, data: { id: number; nombre: string } | null) {
    this.status = status;
    this.mensaje = mensaje;
    this.data = data;
  }
}

