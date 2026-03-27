import { Component } from '@angular/core';
import { NavBar } from './components/nav-bar/nav-bar';
import { HeroSection } from './components/hero-section/hero-section';
import { StatsStrip } from './components/stats-strip/stats-strip';
import { PhilosophySection } from './components/philosophy-section/philosophy-section';
import { ProgramsSection } from './components/programs-section/programs-section';
import { LocationsSection } from './components/locations-section/locations-section';
import { RaceMomentSection } from './components/race-moment-section/race-moment-section';
import { CtaSection } from './components/cta-section/cta-section';
import { LandingFooter } from './components/landing-footer/landing-footer';

@Component({
  selector: 'app-landing-page',
  imports: [
    NavBar,
    HeroSection,
    StatsStrip,
    PhilosophySection,
    ProgramsSection,
    LocationsSection,
    RaceMomentSection,
    CtaSection,
    LandingFooter,
  ],
  templateUrl: './landing-page.html',
  styleUrl: './landing-page.scss',
})
export class LandingPage {}
