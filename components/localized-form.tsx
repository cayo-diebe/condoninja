"use client";

import type { ComponentPropsWithoutRef } from "react";
import { isFormControl, localizeControlValidity, localizeFormValidity } from "@/lib/form-validation";

type Props = Omit<ComponentPropsWithoutRef<"form">, "noValidate">;

export function LocalizedForm({ onSubmit, onInvalidCapture, onInputCapture, onChangeCapture, onResetCapture, ...props }: Props) {
  return <form {...props} noValidate
    onSubmit={event => {
      // Validate explicitly so corrected/programmatically populated fields cannot
      // remain blocked by a stale custom message. Native focus and bubbles stay intact.
      localizeFormValidity(event.currentTarget);
      if (!event.currentTarget.reportValidity()) {
        event.preventDefault();
        return;
      }
      onSubmit?.(event);
    }}
    onInvalidCapture={event => {
      if (isFormControl(event.target)) localizeControlValidity(event.target);
      onInvalidCapture?.(event);
    }}
    onInputCapture={event => {
      if (isFormControl(event.target)) event.target.setCustomValidity("");
      onInputCapture?.(event);
    }}
    onChangeCapture={event => {
      if (isFormControl(event.target)) event.target.setCustomValidity("");
      onChangeCapture?.(event);
    }}
    onResetCapture={event => {
      for (const control of Array.from(event.currentTarget.elements)) {
        if (isFormControl(control)) control.setCustomValidity("");
      }
      onResetCapture?.(event);
    }} />;
}
