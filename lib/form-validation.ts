type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

type ValidatableField = {
  validity: ValidityState;
  tagName: string;
  type?: string;
  title?: string;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
};

export function nativeValidationMessage(field: ValidatableField) {
  const { validity } = field;
  if (validity.valueMissing) {
    if (field.tagName === "SELECT" || field.type === "radio") return "Selecione uma opção.";
    if (field.type === "checkbox") return "Marque esta opção para continuar.";
    if (field.type === "file") return "Selecione um arquivo.";
    return "Preencha este campo.";
  }
  if (validity.typeMismatch) {
    if (field.type === "email") return "Informe um e-mail válido.";
    if (field.type === "url") return "Informe um endereço de site válido.";
  }
  if (validity.tooShort) return `Use pelo menos ${field.minLength} caracteres.`;
  if (validity.tooLong) return `Use no máximo ${field.maxLength} caracteres.`;
  if (validity.patternMismatch) return field.title || "Preencha este campo no formato solicitado.";
  if (validity.badInput) return "Informe um valor válido para este campo.";
  if (validity.rangeUnderflow) return `Informe um valor maior ou igual a ${field.min}.`;
  if (validity.rangeOverflow) return `Informe um valor menor ou igual a ${field.max}.`;
  if (validity.stepMismatch) return "Informe um valor compatível com o intervalo permitido.";
  return validity.valid ? "" : "Revise o valor informado neste campo.";
}

export function isFormControl(target: EventTarget | null): target is FormControl {
  return target instanceof HTMLInputElement || target instanceof HTMLSelectElement || target instanceof HTMLTextAreaElement;
}

export function localizeControlValidity(control: FormControl) {
  // Remove a previous message before inspecting native constraints again.
  control.setCustomValidity("");
  if (control.willValidate) control.setCustomValidity(nativeValidationMessage(control));
}

export function localizeFormValidity(form: HTMLFormElement) {
  for (const control of Array.from(form.elements)) {
    if (isFormControl(control)) localizeControlValidity(control);
  }
}
