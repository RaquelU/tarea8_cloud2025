import { Component } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BackendService }    from '../../services/backend.service';
import { AuthResponse }      from '../../models/auth-response.model';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  errorMsg: string = '';
  cargando: boolean = false;

  constructor(private backend: BackendService, private router: Router) {}

  onSubmit(nombreInput: HTMLInputElement, emailInput: HTMLInputElement, fechaInput: HTMLInputElement, contraseniaInput: HTMLInputElement, generoInput: HTMLSelectElement) {
    const nombreVal = nombreInput.value.trim();
    const emailVal = emailInput.value.trim();
    const fechaVal = fechaInput.value; // "YYYY-MM-DD"
    const contraVal = contraseniaInput.value.trim();
    const generoVal = generoInput.value.trim();

    this.errorMsg = '';
    if (!nombreVal || !emailVal || !fechaVal || !contraVal) {
      this.errorMsg = 'Todos los campos excepto género son obligatorios.';
      return;
    }

    this.cargando = true;
    this.backend.register(nombreVal, emailVal, fechaVal, contraVal, generoVal).subscribe({
        next: (resp: AuthResponse) => {
          this.cargando = false;
          if (resp.status === 0) {
            // Después de registrarse, ir a login
            this.router.navigate(['/login']);
          } else {
            this.errorMsg = resp.mensaje;
          }
        },
        error: () => {
          this.cargando = false;
          this.errorMsg = 'Error en el servidor. Intenta más tarde.';
        }
      });
      
  }
}
