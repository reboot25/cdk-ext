# A library to extends Angular CDK

This library extend Angular CDK Scrolling to support multi column scrolling

## How to use

1. import ```MultiColumnVirtualScroll``` into yor component
2. make sure the ```cdk-virtual-scroll-content-wrapper``` styles contain:
   ``` css
   {
     display: flex;
     flex-wrap: wrap;
   }
   ```
3. define item dimension:
   
   for scrolling, set itemDimension info, width can be in percentage or pixel:
   ``` ts
   export class ItemDimension {
     width!: number | string;
     height!: number;
   }
   ```
   for example:
   ``` ts
   itemDimension = { width: 400, height: 100 };
   ```
   ``` ts
   itemDimension = { width: '33%', height: 100 };
   ```
4. make sure the item itself has the same size as the item dimension

## Usage example
### app.component.ts
``` ts
import { MultiColumnsVirtualScroll } from '@reboot25/cdk-ext/scrolling';

@Component({
  imports: [ScrollingModule, MultiColumnsVirtualScroll],
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

```

### app.compenent.scss
``` scss
.multi-col-scrolling {
  >.cdk-virtual-scroll-content-wrapper {
    display: flex;
    flex-wrap: wrap;
  }
}
```

### app.component.html

``` html
<cdk-virtual-scroll-viewport [itemDimension]="itemDimension" class="w-1/2 h-2/3 border flex flex-wrap multi-col-scrolling" minBufferPx="800" maxBufferPx="800">
  <div *cdkVirtualFor="let item of items" class="h-[100px] w-[400px]">
    <div class="h-full p-1">
      <div class="h-full border p-2 shadow flex items-center hover:bg-blue-400 hover:text-white cursor-pointer justify-center">{{item}}</div>
    </div>
  </div>
</cdk-virtual-scroll-viewport>
```

## Live demo
- Angular 16: https://angular-tailwind-aqrhfby3.stackblitz.io/