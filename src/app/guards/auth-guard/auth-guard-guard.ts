import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { UserService } from '../../services/user.service';

export const authGuardGuard: CanActivateFn = (route, state) => {
  const userService = inject(UserService);
  const user = userService.user();

  if (user) {
    return true;
  } else {
    window.location.href = '/auth/sign-in';
    return false;
  }
};
