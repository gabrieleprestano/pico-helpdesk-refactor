import { CommonModule } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { UserService } from '../../services/user.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-menu',
  imports: [CommonModule],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
})
export class UserMenu {
  protected userService = inject(UserService);
  protected router = inject(Router);
  protected themeService = inject(ThemeService);

  isOpen = input<boolean>(false);

  theme = this.themeService.theme;

  toggleTheme(e: Event) {
    e.stopPropagation();
    this.themeService.toggleTheme();
  }

  signOut(e: Event) {
    e.stopPropagation();
    this.userService.logout();
    this.router.navigate(['/auth/sign-in']);
  }
}
