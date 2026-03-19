import { Injectable, signal } from "@angular/core";

@Injectable({providedIn: "root"})
export class BlockHttpService {
  public readonly status = signal(false);
  public readonly count = signal(0);

  public enable() {
    this.count.update(value => value + 1);
    this.status.set(true);
  }

  public disable() {
    this.count.update(value => value - 1);
    this.status.set(!(this.count() < 1));
  }
}
