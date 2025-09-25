export class Tarea {
  id: number;
  titulo: string;
  prioridad: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_creacionRaw?: Date;
  estado: string;
  grupo: string;
  favorito: boolean = false;

  constructor(id: number, titulo: string, prioridad: string, descripcion: string, fecha_creacion: string, estado: string, grupo: string) {
    this.id = id;
    this.titulo = titulo;
    this.prioridad = prioridad;
    this.descripcion = descripcion;
    this.fecha_creacion = fecha_creacion;
    this.estado = estado;
    this.grupo = grupo;
    this.favorito = false;
  }
}
