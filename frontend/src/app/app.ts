import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  sidebarCollapsed = this.getInitialSidebarState();

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    localStorage.setItem('fingers-sidebar', this.sidebarCollapsed ? 'collapsed' : 'expanded');
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  private getInitialSidebarState(): boolean {
    return localStorage.getItem('fingers-sidebar') === 'collapsed';
  }
}
