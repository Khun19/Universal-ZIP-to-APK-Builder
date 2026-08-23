import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <header class="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        <!-- Brand Logo & Title -->
        <button
          type="button"
          class="flex items-center gap-3 cursor-pointer text-left bg-transparent border-0 p-0 focus:outline-none"
          (click)="service.setStep('upload')"
        >
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-slate-950 shadow-md shadow-amber-500/20">
            <mat-icon class="text-2xl font-bold">camera_indoor</mat-icon>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-extrabold text-base tracking-tight text-white">AI Headshot Photographer</span>
              <span class="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                Studio Edition
              </span>
            </div>
            <p class="text-xs text-slate-400">85mm f/1.4 Executive Portrait Synthesizer</p>
          </div>
        </button>

        <!-- Right Side: Credits, Session Purge & Actions -->
        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Credits Remaining Pill -->
          <div class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200">
            <mat-icon class="text-amber-400 text-sm">monetization_on</mat-icon>
            <span>Credits: <strong class="text-white">{{ service.creditsRemaining() }}</strong></span>
          </div>

          <!-- Purge / Privacy Trigger -->
          <button
            type="button"
            id="header-purge-btn"
            (click)="service.purgeSessionData()"
            title="Immediately wipe all uploaded photos and generated images from temporary cache"
            class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-800/40 transition-colors"
          >
            <mat-icon class="text-sm">delete_sweep</mat-icon>
            <span>Delete my photos now</span>
          </button>
        </div>

      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly service = inject(HeadshotService);
}
