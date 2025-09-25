import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Tarea } from '../models/tarea.model';
import { TareaResponse } from '../models/tarea-response.model';
import { AuthResponse } from '../models/auth-response.model';

const DOMINIO = 'http://localhost:3333';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Metodos para Auth (register y login)
  register(nombre: string, email: string, fecha_nacimiento: string, contrasenia: string, genero: string) {
    const headers = this.getHeaders();
    return this.http.post<AuthResponse>(`${DOMINIO}/register`,{ email, nombre, fecha_nacimiento, contrasenia, genero }, { headers });
  }

  login(email: string, contrasenia: string) {
    const headers = this.getHeaders();
    return this.http.post<AuthResponse>(`${DOMINIO}/login`, { email, contrasenia }, { headers });
  }

  // Metodos de tareas (listar, grabar, editar y borrar)
  obtenerTareas(usuarioId: number) {
    const headers = this.getHeaders();
    return this.http.get<TareaResponse>(`${DOMINIO}/tarea/${usuarioId}`, { headers });
  }

  grabarTarea(payload: {
    titulo: string;
    prioridad: string;
    descripcion?: string;
    grupo?: string;
    usuario_id: number;
  }) {
    const headers = this.getHeaders();
    return this.http.post<TareaResponse>(`${DOMINIO}/tarea`, payload, { headers });
  }

  editarTarea(tarea: Partial<Tarea> & { id: number }) {
    const headers = this.getHeaders();
    return this.http.put<TareaResponse>(`${DOMINIO}/tarea/${tarea.id}`, tarea, { headers });
  }

  borrarTarea(id: number) {
    const headers = this.getHeaders();
    return this.http.delete<TareaResponse>(`${DOMINIO}/tarea/${id}`, { headers });
  }
}
