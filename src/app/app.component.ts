import { ScrollingModule } from '@angular/cdk/scrolling';
import { Component } from '@angular/core';
import { MultiColumnsVirtualScroll } from '@reboot25/cdk-ext/scrolling';

@Component({
  imports: [ScrollingModule, MultiColumnsVirtualScroll],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'cdk-ext-demo';
  itemDimension = { width: 400, height: 100 };
  items = Array.from({ length: 100000 }).map((_, i) => `Item #${i}`);
}
