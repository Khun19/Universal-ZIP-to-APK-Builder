import {ChangeDetectionStrategy, Component, computed, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeadshotService} from '../../services/headshot.service';

@Component({
  selector: 'app-processing-screen',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule],
  template: `
    <div class="max-w-3xl mx-auto px-4 py-12 sm:py-16 text-center">
      
      <!-- Studio Aperture Camera Animation -->
      <div class="relative w-32 h-32 mx-auto mb-8">
        <!-- Outer Glowing Ring -->
        <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/30 to-amber-300/10 blur-xl animate-pulse"></div>
        
        <!-- Rotating Aperture Ring -->
        <div class="relative w-full h-full rounded-full border-2 border-amber-400/40 flex items-center justify-center bg-slate-900 shadow-2xl overflow-hidden">
          <div class="absolute inset-2 rounded-full border border-dashed border-amber-400/30 animate-[spin_8s_linear_infinite]"></div>
          
          <!-- Inner Lens Elements -->
          <div class="w-16 h-16 rounded-full bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 flex items-center justify-center border border-amber-500/40 shadow-inner">
            <mat-icon class="text-3xl text-amber-400 animate-pulse">shutter_speed</mat-icon>
          </div>
        </div>

        <!-- Progress Badge floating -->
        <div class="absolute -bottom-2 right-2 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-bold text-xs shadow-lg">
          {{ progressPercent() }}%
        </div>
      </div>

      <!-- Main Status Title -->
      <h1 class="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
        {{ activeStepTitle() }}
      </h1>
      <p class="text-sm sm:text-base text-slate-400 max-w-lg mx-auto mb-8">
        {{ activeStepDesc() }}
      </p>

      <!-- Main Progress Bar -->
      <div class="max-w-md mx-auto mb-4">
        <div class="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
          <div
            class="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 rounded-full transition-all duration-500 ease-out shadow-sm"
            [style.width.%]="progressPercent()"
          ></div>
        </div>
        
        <div class="flex items-center justify-between text-xs text-slate-400 mt-2">
          <span>Synthesizing {{ totalVariations() }} variations</span>
          <span class="text-amber-400 font-medium flex items-center gap-1">
            <mat-icon class="text-xs">schedule</mat-icon>
            ~{{ estimatedRemaining() }}s remaining
          </span>
        </div>
      </div>

      <!-- Real-time Step Timeline Tracker -->
      <div class="max-w-lg mx-auto mt-10 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 text-left">
        <h2 class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <mat-icon class="text-amber-400 text-sm">tune</mat-icon>
          <span>Studio Synthesis Pipeline</span>
        </h2>

        <div class="space-y-4">
          @for (step of steps(); track step.id; let idx = $index) {
            <div class="flex items-start gap-3">
              <!-- Step Icon / Status -->
              <div
                class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs transition-colors mt-0.5"
                [class.bg-emerald-500]="step.status === 'completed'"
                [class.text-white]="step.status === 'completed'"
                [class.bg-amber-400]="step.status === 'active'"
                [class.text-slate-950]="step.status === 'active'"
                [class.bg-slate-800]="step.status === 'pending'"
                [class.text-slate-500]="step.status === 'pending'"
              >
                @if (step.status === 'completed') {
                  <mat-icon class="text-xs font-bold">check</mat-icon>
                } @else if (step.status === 'active') {
                  <div class="w-2 h-2 rounded-full bg-slate-950 animate-ping"></div>
                } @else {
                  <span class="text-[10px]">{{ idx + 1 }}</span>
                }
              </div>

              <!-- Title & description -->
              <div class="flex-1">
                <p
                  class="text-xs font-semibold"
                  [class.text-white]="step.status === 'active' || step.status === 'completed'"
                  [class.text-slate-500]="step.status === 'pending'"
                >
                  {{ step.title }}
                </p>
                <p
                  class="text-[11px] mt-0.5"
                  [class.text-slate-400]="step.status === 'active' || step.status === 'completed'"
                  [class.text-slate-600]="step.status === 'pending'"
                >
                  {{ step.description }}
                </p>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Reference Photo Preview Strip -->
      <div class="mt-8 flex items-center justify-center gap-2">
        <span class="text-xs text-slate-500 mr-2">Reference photos in memory:</span>
        @for (photo of service.uploadedPhotos().slice(0, 4); track photo.id) {
          <div class="w-9 h-9 rounded-lg overflow-hidden border border-slate-700 bg-slate-950">
            <img [src]="photo.dataUrl" [alt]="photo.name" class="w-full h-full object-cover" referrerpolicy="no-referrer" />
          </div>
        }
      </div>

    </div>
  `,
})
export class ProcessingScreenComponent {
  readonly service = inject(HeadshotService);

  readonly progressPercent = computed(() => {
    return this.service.activeJob()?.progressPercent || 25;
  });

  readonly estimatedRemaining = computed(() => {
    return this.service.activeJob()?.estimatedSecondsRemaining || 18;
  });

  readonly steps = computed(() => {
    return this.service.activeJob()?.steps || [];
  });

  readonly totalVariations = computed(() => {
    return this.service.selectedStyles().length * 4;
  });

  readonly activeStepTitle = computed(() => {
    const job = this.service.activeJob();
    if (!job || !job.steps.length) return 'Preparing Studio Lighting...';
    const active = job.steps.find((s) => s.status === 'active') || job.steps[job.steps.length - 1];
    return active.title;
  });

  readonly activeStepDesc = computed(() => {
    const job = this.service.activeJob();
    if (!job || !job.steps.length) return 'Calibrating face mesh and tone curves...';
    const active = job.steps.find((s) => s.status === 'active') || job.steps[job.steps.length - 1];
    return active.description;
  });
}
