export function isNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0
}

export function validateRequiredField(value: unknown, fieldName: string) {
  return isNonEmptyString(value) ? null : `${fieldName} is required.`
}
