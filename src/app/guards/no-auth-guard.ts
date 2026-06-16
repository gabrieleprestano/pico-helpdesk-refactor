import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userService = inject(UserService);

  const user = userService.user();

  if (!user) {
    return true;
  } else {
    router.navigate(['/']);
    return false;
  }
};
