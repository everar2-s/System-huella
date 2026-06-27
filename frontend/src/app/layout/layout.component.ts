import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css',
})
export class LayoutComponent {
  readonly authService = inject(AuthService);

  sidebarClosed = false;

  toggleSidebar() {
    this.sidebarClosed = !this.sidebarClosed;
  }

  logout() {
    this.authService.logout();
  }
}