import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';

class LetDirectiveContext<T = unknown> {
  $implicit: T;
  let: T;
}
/**
 * Create a context variable.
 */
@Directive({
  selector: '[let]',
  standalone: true,
})
export class LetDirective<T = unknown> {
  private templateContext = new LetDirectiveContext<T>();
  private initialized = false;

  constructor(
    private templateRef: TemplateRef<LetDirectiveContext<T>>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input()
  set let(value: T) {
    this.templateContext.$implicit = value;
    this.templateContext.let = value;
    if (!this.initialized) {
      this.viewContainer.createEmbeddedView(
        this.templateRef,
        this.templateContext
      );
      this.initialized = true;
    }
  }

  static ngTemplateContextGuard<T>(
    dir: LetDirective<T>,
    ctx: any
  ): ctx is LetDirectiveContext<NonNullable<T>> {
    return true;
  }
}
