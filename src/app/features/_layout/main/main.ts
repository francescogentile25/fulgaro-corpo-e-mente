import { Component, OnInit } from '@angular/core';
import { Header } from "../header/header";
import { Footer } from "../footer/footer";
import { RouterOutlet } from "@angular/router";
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: 'app-main',
  imports: [
    Header,
    Footer,
    RouterOutlet,
    Sidebar
  ],
  templateUrl: './main.html',
  styleUrl: './main.scss',
})
export class Main{

}
