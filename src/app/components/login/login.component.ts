import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { AuthResponse } from '../../models/auth-response.model';

@Component({
  imports: [CommonModule, RouterModule],
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  errorMsg: string = '';
  cargando: boolean = false;

  constructor(private backend: BackendService, private router: Router) {}

  onSubmit(emailInput: HTMLInputElement, contraInput: HTMLInputElement) {
    const emailVal = emailInput.value.trim();
    const contraVal = contraInput.value.trim();

    this.errorMsg = '';
    if (!emailVal || !contraVal) {
      this.errorMsg = 'Email y contraseña son obligatorios.';
      return;
    }

    this.cargando = true;
    this.backend.login(emailVal, contraVal).subscribe({
      next: (resp: AuthResponse) => {
        this.cargando = false;
        if (resp.status === 0 && resp.data) {
          // Guardar userId en localStorage
          localStorage.setItem('userId', resp.data.id.toString());
          // Redirigir a /tareas/{userId}
          this.router.navigate(['/tareas', resp.data.id]);
        } else {
          this.errorMsg = resp.mensaje;
        }
      },
      error: () => {
        this.cargando = false;
        this.errorMsg = 'Credenciales inválidas o error de servidor.';
      }
    });
  }
}




