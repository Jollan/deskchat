import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { LoaderComponent } from '../loader/loader.component';

@Component({
  selector: 'app-image-loader',
  standalone: true,
  imports: [LoaderComponent, NgClass],
  templateUrl: './image-loader.component.html',
  styleUrl: './image-loader.component.scss',
})
export class ImageLoaderComponent {
  @Input()
  src: string;
  @Input()
  alt: string;
}
