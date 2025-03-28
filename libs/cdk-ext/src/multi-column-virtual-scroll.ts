import { coerceNumberProperty, NumberInput } from "@angular/cdk/coercion";
import { CdkVirtualScrollViewport, VirtualScrollStrategy, VIRTUAL_SCROLL_STRATEGY } from "@angular/cdk/scrolling";
import { Directive, forwardRef, Input, OnChanges } from "@angular/core";
import { distinctUntilChanged, Observable, Subject } from "rxjs";

// Only support vertical scroll
export class MultiColumnVirtualScrollStrategy implements VirtualScrollStrategy {
  private readonly _scrolledIndexChange = new Subject<number>();

  /** @docs-private Implemented as part of VirtualScrollStrategy. */
  scrolledIndexChange: Observable<number> = this._scrolledIndexChange.pipe(distinctUntilChanged());
  private _itemDimension: { width: number, height: number };
  private _minBufferPx: number;
  private _maxBufferPx: number;
  private _viewport: CdkVirtualScrollViewport | null = null;
  constructor(itemDimension: { width: number, height: number }, minBufferPx: number, maxBufferPx: number) {
    this._itemDimension = itemDimension;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
  }
  /**
   * after viewPort size calculated, attach to the viewPort
   * @param viewport
   */
  attach(viewport: CdkVirtualScrollViewport): void {
    this._viewport = viewport;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }

  /**
   * detach on viewPort destroy
   */
  detach(): void {
    this._scrolledIndexChange.complete();
    this._viewport = null;
  }
  /**
   * Update the item size and buffer size.
   * @param itemSize The size of the items in the virtually scrolling cdk-ext.
   * @param minBufferPx The minimum amount of buffer (in pixels) before needing to render more
   * @param maxBufferPx The amount of buffer (in pixels) to render when rendering more.
   */
  updateItemAndBufferSize(itemSize: { width: number, height: number }, minBufferPx: number, maxBufferPx: number) {
    if (maxBufferPx < minBufferPx) {
      throw Error('CDK virtual scroll: maxBufferPx must be greater than or equal to minBufferPx');
    }
    this._itemDimension = itemSize;
    this._minBufferPx = minBufferPx;
    this._maxBufferPx = maxBufferPx;
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }
  onContentScrolled(): void {
    this._updateRenderedRange()
  }
  onDataLengthChanged(): void {
    this._updateTotalContentSize();
    this._updateRenderedRange();
  }
  onContentRendered(): void {
    //
  }
  onRenderedOffsetChanged(): void {
    //
  }
  /**
   * scroll to item by index
   * @param dataIndex index of the data item
   * @param behavior scroll behavior
   */
  scrollToIndex(dataIndex: number, behavior: ScrollBehavior): void {
    if (this._viewport) {
      this._viewport.scrollToOffset(this.getScrollIndex(dataIndex) * this._itemDimension.height, behavior);
    }
  }
  /**
   *
   * @param dataIndex of the data
   * @returns offset of the index
   */
  private getScrollIndex(dataIndex: number) {
    if (this._viewport) {
      if (this._viewport.orientation === 'vertical') {
        const viewPortWidth = this._viewport.elementRef.nativeElement.clientWidth;
        const colPerRow = this._itemDimension.width > 0 ? Math.floor(viewPortWidth / this._itemDimension.width) : 1;
        const rowIndex = Math.floor(dataIndex / colPerRow);
        return rowIndex;
      }
      else {
        console.warn('The horizontal mode is not support yet.')
      }
    }
    return 0;
  }

  /**
   *
   * @returns range of data to render
   */
  private _updateRenderedRange() {
    if (!this._viewport) {
      return;
    }
    // we support multiple column, so we need know the column number for calc
    // if not specific item width, treat as single column scroll
    const viewPortWidth = this._viewport.elementRef.nativeElement.clientWidth;
    // need determin col(item) per row to calculate actual scroll height
    // use Math.floor becuase if there not enough space for 3, we use 2 not 2.*
    const colPerRow = this._itemDimension.width > 0 && viewPortWidth > this._itemDimension.width ? Math.floor(viewPortWidth / this._itemDimension.width) : 1;
    // get the current rendered range {start,end} of the data, actually the start/end indexs of the array
    const renderedRange = this._viewport.getRenderedRange();
    // init new render range as current, start, end
    const newRange = { start: renderedRange.start, end: renderedRange.end };
    // actually the height of the view port, we calculated based on height
    const viewportSize = this._viewport.getViewportSize();

    // total data length
    const dataLength = this._viewport.getDataLength();
    // current scrolloffset
    let scrollOffset = this._viewport.measureScrollOffset();

    // Prevent NaN as result when dividing by zero.
    const itemSize = this._itemDimension.height;
    // Totally same as fixed size scrolling start here except dataLength->rowLength
    let firstVisibleIndex = itemSize > 0 ? scrollOffset / itemSize : 0;

    // If user scrolls to the bottom of the cdk-ext and data changes to a smaller cdk-ext
    //! use original range to check exceed condition
    if (newRange.end > dataLength) {
      // We have to recalculate the first visible index based on new data length and viewport size.
      const maxVisibleItems = Math.ceil(viewportSize / itemSize);
      const newVisibleIndex = Math.max(
        0,
        Math.min(firstVisibleIndex, dataLength - maxVisibleItems),
      ) * colPerRow;

      // If first visible index changed we must update scroll offset to handle start/end buffers
      // Current range must also be adjusted to cover the new position (bottom of new cdk-ext).
      if (firstVisibleIndex != newVisibleIndex) {
        firstVisibleIndex = newVisibleIndex;
        scrollOffset = newVisibleIndex * itemSize;
        newRange.start = Math.floor(firstVisibleIndex) * colPerRow;
      }

      newRange.end = Math.max(0, Math.min(dataLength, (newRange.start + maxVisibleItems) * colPerRow));
    }

    const rowRange = { start: newRange.start / colPerRow, end: Math.ceil(newRange.end / colPerRow) };
    const startBuffer = scrollOffset - rowRange.start * itemSize;
    if (startBuffer < this._minBufferPx && rowRange.start != 0) {
      const expandStart = Math.ceil((this._maxBufferPx - startBuffer) / itemSize);
      rowRange.start = Math.max(0, rowRange.start - expandStart);
      rowRange.end = Math.min(
        dataLength,
        Math.ceil(firstVisibleIndex + (viewportSize + this._minBufferPx) / itemSize),
      );
    } else {
      const endBuffer = rowRange.end * itemSize - (scrollOffset + viewportSize);
      if (endBuffer < this._minBufferPx && rowRange.end != dataLength) {
        const expandEnd = Math.ceil((this._maxBufferPx - endBuffer) / itemSize);
        if (expandEnd > 0) {
          rowRange.end = Math.min(dataLength, rowRange.end + expandEnd);
          rowRange.start = Math.max(
            0,
            Math.floor(firstVisibleIndex - this._minBufferPx / itemSize),
          );
        }
      }
    }
    const updatedRange = { start: rowRange.start * colPerRow, end: Math.min(dataLength, rowRange.end * colPerRow) }
    // Totally same as fixed size scrolling above
    this._viewport.setRenderedRange(updatedRange);
    this._viewport.setRenderedContentOffset(this._itemDimension.height * rowRange.start);
    this._scrolledIndexChange.next(Math.floor(firstVisibleIndex));
  }
  /**
   *
   * @returns Total virtual scroll size based on datalength and itemDemension
   */
  private _updateTotalContentSize() {
    if (!this._viewport) {
      return;
    }
    const viewPortWidth = this._viewport.elementRef.nativeElement.clientWidth;
    const colPerRow = this._itemDimension.width > 0 ? Math.floor(viewPortWidth / this._itemDimension.width) : 1;
    const rows = Math.ceil(this._viewport.getDataLength() / colPerRow);
    this._viewport.setTotalContentSize(rows * this._itemDimension.height);
  }

}

/**
 * Provider factory for `FixedSizeVirtualScrollStrategy` that simply extracts the already created
 * `FixedSizeVirtualScrollStrategy` from the given directive.
 * @param fixedSizeDir The instance of `CdkFixedSizeVirtualScroll` to extract the
 *     `FixedSizeVirtualScrollStrategy` from.
 */
export function _multiColumnVirtualScrollStrategyFactory(fixedSizeDir: MultiColumnVirtualScroll) {
  return fixedSizeDir._scrollStrategy;
}

/** A virtual scroll strategy that supports fixed-size items. */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'cdk-virtual-scroll-viewport[itemDimension]',
  standalone: true,
  providers: [
    {
      provide: VIRTUAL_SCROLL_STRATEGY,
      useFactory: _multiColumnVirtualScrollStrategyFactory,
      deps: [forwardRef(() => MultiColumnVirtualScroll)],
    },
  ],
})
// eslint-disable-next-line @angular-eslint/directive-class-suffix
export class MultiColumnVirtualScroll implements OnChanges {
  /**
   * For multiple columns virtual scroll, need to know how many column per row
   * Make sure the item dimension equal to the settings,
   * remember padding/margin/border are counter in as well
   */
  @Input()
  get itemDimension() {
    return this._itemDimension;
  }
  set itemDimension(val: { width: number, height: number }) {
    this._itemDimension = val;
  }
  _itemDimension = { width: 240, height: 50 };

  /**
   * The minimum amount of buffer rendered beyond the viewport (in pixels).
   * If the amount of buffer dips below this number, more items will be rendered. Defaults to 100px.
   */
  @Input()
  get minBufferPx(): number {
    return this._minBufferPx;
  }
  set minBufferPx(value: NumberInput) {
    this._minBufferPx = coerceNumberProperty(value);
  }
  _minBufferPx = 100;

  /**
   * The number of pixels worth of buffer to render for when rendering new items. Defaults to 200px.
   */
  @Input()
  get maxBufferPx(): number {
    return this._maxBufferPx;
  }
  set maxBufferPx(value: NumberInput) {
    this._maxBufferPx = coerceNumberProperty(value);
  }
  _maxBufferPx = 200;

  /** The scroll strategy used by this directive. */
  _scrollStrategy = new MultiColumnVirtualScrollStrategy(
    this.itemDimension,
    this.minBufferPx,
    this.maxBufferPx,
  );

  ngOnChanges() {
    this._scrollStrategy.updateItemAndBufferSize(this.itemDimension, this.minBufferPx, this.maxBufferPx);
  }
}
