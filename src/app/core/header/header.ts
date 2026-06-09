import { Component, computed, inject } from '@angular/core';
import { Container } from '../../layout/container/container';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-header',
  imports: [Container],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private userService = inject(UserService);

  user = this.userService.user;

  userName = computed(() => this.user()?.email.split('@')[0].toLowerCase() || '');
  userEmail = computed(() => this.user()?.email || '');
  userInitials = computed(() => {
    if (!this.userEmail()) return 'N/A';

    const [first = '', second = ''] = this.userEmail().split('.');
    return `${first.charAt(0).toUpperCase()}${second.charAt(0).toUpperCase()}`;
  });

  logout() {
    this.userService.logout();
  }
}
