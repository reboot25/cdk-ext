import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component, ViewEncapsulation } from '@angular/core';
import { CdkExtMultiColumnVirtualScroll } from '@reboot25/cdk-ext/scrolling';

@Component({
  imports: [ScrollingModule, CdkExtMultiColumnVirtualScroll],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class AppComponent {
  title = 'cdk-ext-demo';
  itemDimension = { width: 400, height: 100 };
  items = Array.from({ length: 100000 }).map((_, i) => `Item #${i}`);
}
