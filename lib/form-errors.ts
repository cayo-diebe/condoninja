// Only messages deliberately returned by our localized API may reach the user.
// Browser/network/JSON exceptions can be in any language and use the fallback.
export class FormRequestError extends Error {}

export function formErrorMessage(error: unknown, fallback: string) {
  return error instanceof FormRequestError && error.message.trim() ? error.message : fallback;
}
