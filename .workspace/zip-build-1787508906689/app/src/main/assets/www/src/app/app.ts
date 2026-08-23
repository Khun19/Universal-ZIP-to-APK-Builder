import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {MatIconModule} from '@angular/material/icon';
import {HeaderComponent} from './components/header/header';
import {StepperComponent} from './components/stepper/stepper';
import {UploadScreenComponent} from './components/upload-screen/upload-screen';
import {StyleSelectionComponent} from './components/style-selection/style-selection';
import {AttireOptionsComponent} from './components/attire-options/attire-options';
import {ProcessingScreenComponent} from './components/processing-screen/processing-screen';
import {ResultsScreenComponent} from './components/results-screen/results-screen';
import {ComparisonSliderComponent} from './components/comparison-slider/comparison-slider';
import {LightboxModalComponent} from './components/lightbox-modal/lightbox-modal';
import {HeadshotService} from './services/headshot.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [
    MatIconModule,
    HeaderComponent,
    StepperComponent,
    UploadScreenComponent,
    StyleSelectionComponent,
    AttireOptionsComponent,
    ProcessingScreenComponent,
    ResultsScreenComponent,
    ComparisonSliderComponent,
    LightboxModalComponent,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  readonly service = inject(HeadshotService);
}
