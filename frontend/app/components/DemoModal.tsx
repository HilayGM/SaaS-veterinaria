'use client'

import { useActionState, useEffect, useRef } from 'react'
import { submitDemoRequest, type DemoFormState } from '@/app/actions/demo'

interface DemoModalProps {
  isOpen: boolean
  onClose: () => void
}

const initialState: DemoFormState = null

export default function DemoModal({ isOpen, onClose }: DemoModalProps) {
  const [state, formAction, isPending] = useActionState(submitDemoRequest, initialState)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar estado open/close con el <dialog> nativo
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (isOpen) {
      dialog.showModal()
      firstInputRef.current?.focus()
    } else {
      dialog.close()
    }
  }, [isOpen])

  // Cerrar al presionar Escape (ya lo maneja el dialog nativo)
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const handleClose = () => onClose()
    dialog.addEventListener('close', handleClose)
    return () => dialog.removeEventListener('close', handleClose)
  }, [onClose])

  // Cerrar al hacer clic en el backdrop
  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    const rect = dialogRef.current?.getBoundingClientRect()
    if (!rect) return
    const clickedOutside =
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    if (clickedOutside) onClose()
  }

  return (
    <dialog
      ref={dialogRef}
      className="demo-modal"
      onClick={handleBackdropClick}
    >
      <div className="demo-modal__inner">

        {/* Header */}
        <div className="demo-modal__header">
          <div className="demo-modal__header-content">
            <i className="fa-solid fa-heart-pulse demo-modal__logo-icon" />
            <div>
              <h2 className="demo-modal__title">Solicitar Demo Gratuita</h2>
              <p className="demo-modal__subtitle">Te contactamos en menos de 24 horas</p>
            </div>
          </div>
          <button
            type="button"
            className="demo-modal__close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Success state */}
        {state?.success ? (
          <div className="demo-modal__success">
            <div className="demo-modal__success-icon">
              <i className="fa-solid fa-circle-check" />
            </div>
            <h3>¡Solicitud enviada!</h3>
            <p>
              Recibimos tu información. Nuestro equipo se pondrá en contacto contigo
              en menos de 24 horas para coordinar tu demo personalizada.
            </p>
            <button
              type="button"
              className="demo-modal__btn-primary"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
        ) : (
          /* Form */
          <form action={formAction} className="demo-modal__form" noValidate>

            {state?.error && (
              <div className="demo-modal__error" role="alert">
                <i className="fa-solid fa-circle-exclamation" />
                {state.error}
              </div>
            )}

            <div className="demo-modal__grid">
              {/* Nombre */}
              <div className="demo-modal__field">
                <label htmlFor="dm-nombre" className="demo-modal__label">
                  Nombre completo <span className="demo-modal__required">*</span>
                </label>
                <input
                  ref={firstInputRef}
                  id="dm-nombre"
                  name="nombre"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="ej. María García"
                  className="demo-modal__input"
                  disabled={isPending}
                />
              </div>

              {/* Email */}
              <div className="demo-modal__field">
                <label htmlFor="dm-email" className="demo-modal__label">
                  Email <span className="demo-modal__required">*</span>
                </label>
                <input
                  id="dm-email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="ej. maria@clinicavet.com"
                  className="demo-modal__input"
                  disabled={isPending}
                />
              </div>

              {/* Teléfono */}
              <div className="demo-modal__field">
                <label htmlFor="dm-telefono" className="demo-modal__label">
                  Teléfono
                </label>
                <input
                  id="dm-telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  placeholder="ej. +52 55 1234 5678"
                  className="demo-modal__input"
                  disabled={isPending}
                />
              </div>

              {/* Clínica */}
              <div className="demo-modal__field">
                <label htmlFor="dm-clinica" className="demo-modal__label">
                  Nombre de tu clínica
                </label>
                <input
                  id="dm-clinica"
                  name="clinica"
                  type="text"
                  placeholder="ej. Clínica Veterinaria Las Palmas"
                  className="demo-modal__input"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Mensaje */}
            <div className="demo-modal__field">
              <label htmlFor="dm-mensaje" className="demo-modal__label">
                ¿Algo que quieras contarnos?
              </label>
              <textarea
                id="dm-mensaje"
                name="mensaje"
                rows={3}
                placeholder="Cuéntanos sobre tu veterinaria, cuántos veterinarios tienen, qué problema quieres resolver..."
                className="demo-modal__input demo-modal__textarea"
                disabled={isPending}
              />
            </div>

            {/* Security note */}
            <p className="demo-modal__security">
              <i className="fa-solid fa-lock" />
              Datos enviados de forma segura · Nunca compartimos tu información
            </p>

            {/* Actions */}
            <div className="demo-modal__actions">
              <button
                type="button"
                className="demo-modal__btn-ghost"
                onClick={onClose}
                disabled={isPending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="demo-modal__btn-primary"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <i className="fa-solid fa-circle-notch fa-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <i className="fa-regular fa-calendar" />
                    Solicitar Demo
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </dialog>
  )
}
