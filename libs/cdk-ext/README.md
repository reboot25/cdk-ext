# A library for Angular CDK extensions

This library extend Angular CDK Scrolling to support multi column scrolling

## How to use

1. import ```MultiColumnVirtualScroll``` into yor component
2. import scss

### app.component.ts
```
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

```

### app.component.html

```
<cdk-virtual-scroll-viewport [itemDimension]="itemDimension" class="w-1/2 h-2/3 border flex flex-wrap multi-col-scrolling" minBufferPx="800" maxBufferPx="800">
  <div *cdkVirtualFor="let item of items" class="h-[100px] w-[400px]">
    <div class="h-full p-1">
      <div class="h-full border p-2 shadow flex items-center hover:bg-blue-400 hover:text-white cursor-pointer justify-center">{{item}}</div>
    </div>
  </div>
</cdk-virtual-scroll-viewport>
```

### style.scss

```
@import 'libs/cdk-ext/scrolling/_theme.scss';
```