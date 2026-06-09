import { Component, inject, OnInit } from '@angular/core';
import { Container } from '../../../layout/container/container';
import { UserService } from '../../../services/user.service';

@Component({
  selector: 'app-sign-in',
  imports: [Container],
  templateUrl: './sign-in.html',
  styleUrl: './sign-in.css',
})
export class SignIn implements OnInit {
  private userService = inject(UserService);

  isLoading = this.userService.isLoading;
  error = this.userService.error;

  loginWithAzure() {
    this.userService.signInWithAzure();
  }

  login() {
    console.log('Login button clicked');
    this.userService.loginAzure();
  }

  ngOnInit(): void {
    this.loginWithAzure();
  }
}
