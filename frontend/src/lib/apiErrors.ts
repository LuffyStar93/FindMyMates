import type { AxiosError } from 'axios'

export type ApiErrorResponse = {
  message?: string
  error?: string
  errors?: Record<string, string[]>
  formErrors?: string[]
}

export type ParsedErrors = {
  globalError: string | null
  fieldErrors: Record<string, string>
}

/**
 * Extrait un message global + erreurs par champ
 * à partir d'une erreur Axios renvoyée par le back.
 */
export function parseApiError(err: unknown): ParsedErrors {
  const axiosError = err as AxiosError<any>
  const data = axiosError.response?.data as ApiErrorResponse | undefined

  const globalError =
    data?.message ||
    data?.error ||
    (axiosError.response?.status === 400
      ? "Certaines données sont invalides."
      : "Une erreur inattendue s'est produite.")

  const fieldErrors: Record<string, string> = {}

  if (data?.errors && typeof data.errors === 'object') {
    for (const [field, msgs] of Object.entries(data.errors)) {
      if (Array.isArray(msgs) && msgs.length > 0) {
        fieldErrors[field] = String(msgs[0])
      }
    }
  }

  if (data?.formErrors && data.formErrors.length > 0) {
    fieldErrors['_form'] = data.formErrors.join(' ')
  }

  return { globalError, fieldErrors }
}