import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Header } from '../header/header';
import { Sidebar } from '../sidebar/sidebar';
import { LayoutService } from '../../../core/services/layout.service';

@Component({
  selector: 'app-main',
  imports: [Header, RouterOutlet, Sidebar],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main {
  layoutService = inject(LayoutService);
}
