import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule }       from '@angular/common';
import { FormsModule }        from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { BackendService }     from '../../services/backend.service';
import { Tarea }              from '../../models/tarea.model';
import { TareaResponse }      from '../../models/tarea-response.model';

@Component({
  imports: [CommonModule, FormsModule, RouterModule],
  selector: 'app-tareas',
  templateUrl: './tareas.component.html',
  styleUrls: ['./tareas.component.scss']
})
export class TareasComponent implements OnInit, OnDestroy {
  usuarioId!: number;
  tareas: Tarea[] = [];

  currentTime: number = Date.now();
  private intervalId!: any;

  isDarkMode: boolean = false;

  filterFavoritos: boolean = false;

  // Para crear nueva tarea
  nuevoTitulo: string = '';
  nuevoPrioridad: 'ALTA' | 'MEDIA' | 'BAJA' = 'MEDIA';
  nuevoDescripcion: string = '';
  nuevoGrupo: string = 'General';

  filtroTexto: string = '';
  priorityFilter: 'TODAS' | 'ALTA' | 'MEDIA' | 'BAJA' = 'TODAS';
  sortOption: 'fecha' | 'titulo' | 'prioridad' = 'fecha';
  sortAsc: boolean = true;
  groups: string[] = [];
  newGroupName: string = '';
  selectedGroup: string = 'General';
  cargando: boolean = false;

  // Para editar tarea
  editingTaskId: number | null = null;
  editCache: {
    [id: number]: { titulo: string; prioridad: 'ALTA' | 'MEDIA' | 'BAJA'; descripcion: string; grupo: string }
  } = {};

  constructor(private backend: BackendService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const storedTheme = localStorage.getItem('theme');
    this.isDarkMode = storedTheme === 'dark';
    this.applyThemeToBody();

    const storedId = localStorage.getItem('userId');
    if (!storedId) {
      this.router.navigate(['/login']);
      return;
    }

    this.route.params.subscribe(params => {
      this.usuarioId = +params['usuarioId'];
      if (+storedId !== this.usuarioId) {
        this.router.navigate(['/login']);
        return;
      }
      this.cargarTareas();
    });

    this.intervalId = setInterval(() => {
      this.currentTime = Date.now();
    }, 60 * 1000); // 60_000 ms = 1 minuto
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  // Alterna entre modo claro / modo oscuro
  toggleTheme() {
    console.log('toggleTheme() → isDarkMode antes:', this.isDarkMode);
    this.isDarkMode = !this.isDarkMode;
    console.log('toggleTheme() → isDarkMode después:', this.isDarkMode);
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyThemeToBody();
  }

  private applyThemeToBody() {
    if (this.isDarkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }

  private cargarTareas() {
    this.cargando = true;
    this.backend.obtenerTareas(this.usuarioId).subscribe({
      next: (resp: TareaResponse) => {
        this.cargando = false;
        if (resp.status === 0 && resp.data) {
          const favSet = new Set<number>(this.getFavoritosFromLocalStorage());
          this.tareas = resp.data.map((t: Tarea) => {
            t.fecha_creacionRaw = new Date(t.fecha_creacion);
            t.favorito = favSet.has(t.id);
            return t;
          });
          this.refreshGroups();
          this.tareas.sort((a, b) => {
            const da = (a.fecha_creacionRaw as Date).getTime();
            const db = (b.fecha_creacionRaw as Date).getTime();
            return da - db;
          });
        } else {
          this.tareas = [];
          this.groups = [];
        }
        // Vaciar edición activa al recargar
        this.editingTaskId = null;
        this.editCache = {};
      },
      error: () => {
        this.cargando = false;
        this.tareas = [];
        this.groups = [];
      }
    });
  }

  private refreshGroups() {
    const set = new Set<string>();
    this.tareas.forEach(t => {
      if (t.grupo && t.grupo.trim() !== '' && t.grupo !== 'General') {
        set.add(t.grupo);
      }
    });
    this.groups = Array.from(set);
    if (this.selectedGroup !== 'General' && !this.groups.includes(this.selectedGroup)) {
      this.selectedGroup = 'General';
    }
  }

  private hoyComoFechaSQL(): string {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onSubmitNuevaTarea() {
    const titulo = this.nuevoTitulo.trim();
    const prioridad = this.nuevoPrioridad;
    const descripcion = this.nuevoDescripcion.trim();
    const grupo = this.nuevoGrupo === 'General' ? '' : this.nuevoGrupo;

    if (!titulo || !prioridad) {
      return;
    }

    const payload = {
      titulo,
      prioridad,
      descripcion,
      grupo,
      usuario_id: this.usuarioId,
      fecha_creacion: this.hoyComoFechaSQL(),
      estado: 'ACTIVA'
    };

    this.backend.grabarTarea(payload).subscribe({
      next: () => {
        this.nuevoTitulo = '';
        this.nuevoPrioridad = 'MEDIA';
        this.nuevoDescripcion = '';
        this.nuevoGrupo = 'General';
        this.cargarTareas();
      },
      error: err => {
        console.error('Error al crear tarea:', err);
      }
    });
  }

  getSortedFilteredTasks(): Tarea[] {
    let result = this.tareas.filter(t =>
      t.titulo.toLowerCase().includes(this.filtroTexto.toLowerCase())
    );
    if (this.priorityFilter !== 'TODAS') {
      result = result.filter(t => t.prioridad === this.priorityFilter);
    }

    if (this.filterFavoritos) {
      result = result.filter(t => t.favorito);
    }

    if (this.sortOption === 'titulo') {
      result.sort((a, b) => {
        const cmp = a.titulo.localeCompare(b.titulo);
        return this.sortAsc ? cmp : -cmp;
      });
    } else if (this.sortOption === 'prioridad') {
      const ordenMap: Record<string, number> = { 'ALTA': 1, 'MEDIA': 2, 'BAJA': 3 };
      result.sort((a, b) => ordenMap[a.prioridad] - ordenMap[b.prioridad]);
    }
    return result;
  }

  tasksByGroup(grupo: string): Tarea[] {
    return this.getSortedFilteredTasks().filter(t => t.grupo === grupo);
  }

  tasksForCurrentView(): Tarea[] {
    if (this.selectedGroup === 'General') {
      return this.getSortedFilteredTasks();
    } else {
      return this.tasksByGroup(this.selectedGroup);
    }
  }

  confirmFinalizar(t: Tarea) {
    if (!confirm(`¿Marcar "${t.titulo}" como FINALIZADA?`)) return;
    this.backend.editarTarea({ id: t.id, estado: 'FINALIZADA' }).subscribe({
      next: () => this.cargarTareas(),
      error: err => console.error('Error al marcar finalizada:', err)
    });
  }

  cerrarSesion() {
    localStorage.removeItem('userId');
    this.router.navigate(['/login']);
  }

  agregarGrupo() {
    const g = this.newGroupName.trim();
    if (!g) return;
    if (!this.groups.includes(g)) {
      this.groups.push(g);
    }
    this.newGroupName = '';
  }

  selectGroup(g: string) {
    this.selectedGroup = g;
  }

  toggleSortOrder() {
    this.sortAsc = !this.sortAsc;
  }

  // Métodos de edición de tarea
  startEdit(t: Tarea) {
    this.editingTaskId = t.id;
    this.editCache[t.id] = {
      titulo: t.titulo,
      prioridad: t.prioridad as 'ALTA' | 'MEDIA' | 'BAJA',
      descripcion: t.descripcion,
      // Si está vacío, asignamos 'General' para mostrar al usuario
      grupo: t.grupo && t.grupo.trim() !== '' ? t.grupo : 'General'
    };
  }

  saveEdit(t: Tarea) {
    const cache = this.editCache[t.id];
    if (!cache) return;

    const payload: any = { id: t.id };
    payload.titulo = cache.titulo.trim();
    payload.prioridad = cache.prioridad;
    payload.descripcion = cache.descripcion.trim();
    // Si el usuario seleccionó “General” (string), enviamos cadena vacía
    payload.grupo = cache.grupo === 'General' ? '' : cache.grupo;

    this.backend.editarTarea(payload).subscribe({
      next: () => {
        this.editingTaskId = null;
        this.editCache = {};
        this.cargarTareas();
      },
      error: err => {
        console.error('Error al guardar edición:', err);
      }
    });
  }

  cancelEdit() {
    this.editingTaskId = null;
    this.editCache = {};
  }

  getRelativeTime(fecha?: Date, now?: number): string {
    if (!fecha) return '-';
    const referencia = now ?? Date.now();
    const diffMs = referencia - fecha.getTime();
    const diffMin = Math.floor(diffMs / 1000 / 60);
    if (diffMin < 60) {
      return diffMin <= 1 ? 'hace 1 min' : `hace ${diffMin} min`;
    }
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) {
      return diffHrs <= 1 ? 'hace 1 hr' : `hace ${diffHrs} hrs`;
    }
    return fecha.toLocaleDateString();
  }

  private getFavoritosFromLocalStorage(): number[] {
    const raw = localStorage.getItem('favoritos');
    if (!raw) return [];
    try {
      return JSON.parse(raw) as number[];
    } catch {
      return [];
    }
  }

  private saveFavoritosToLocalStorage(ids: number[]): void {
    localStorage.setItem('favoritos', JSON.stringify(ids));
  }

  toggleFavorite(t: Tarea) {
    t.favorito = !t.favorito;

    const favIds = new Set<number>(this.getFavoritosFromLocalStorage());
    if (t.favorito) {
      favIds.add(t.id);
    } else {
      favIds.delete(t.id);
    }
    this.saveFavoritosToLocalStorage(Array.from(favIds));
  }
}