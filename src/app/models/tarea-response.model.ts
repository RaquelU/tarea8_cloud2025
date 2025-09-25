import { Tarea } from "./tarea.model";

export class TareaResponse {
    status: number;
    mensaje: string;
    data: Tarea[] | null;
    
    constructor(status: number, mensaje: string, data: Tarea[] | null) {
        this.status = status;
        this.mensaje = mensaje;
        this.data = data;
    }
}