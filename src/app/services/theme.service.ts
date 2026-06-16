import { Service, signal } from '@angular/core';
import { Theme } from '../models/types/theme.types';

@Service()
export class ThemeService {
    private prefersDarkTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    private _theme = signal<Theme>(localStorage.getItem('theme') as Theme || (this.prefersDarkTheme ? 'dark' : 'light'));
    readonly theme = this._theme.asReadonly();

    setTheme(theme: Theme) {
        this._theme.set(theme);
        localStorage.setItem('theme', theme);
    }

    toggleTheme() {
        this.setTheme(this._theme() === 'light' ? 'dark' : 'light');
        this.loadTheme();
    }

    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.theme());
    }
}
