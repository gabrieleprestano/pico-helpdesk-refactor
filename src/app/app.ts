import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly themeService = inject(ThemeService);

  protected readonly title = signal('PICO Helpdesk');
  private theme = this.themeService.theme;

  ngOnInit(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
