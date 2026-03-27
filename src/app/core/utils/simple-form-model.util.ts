import { FormControl } from "@angular/forms";

export type SimpleFormModel<T> = {
  [P in keyof T]-?: FormControl<T[P]>
}
