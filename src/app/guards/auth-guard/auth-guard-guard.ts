import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../../services/user.service';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userService = inject(UserService);

  const user = userService.user();

  if (user) {
    return true;
  } else {
    router.navigate(['/auth/sign-in']);
    return false;
  }
};
