import { navigateTo, useRuntimeConfig } from '#imports'
import { useAuth } from './useAuth'

// Google Sign-In helper with COOP/COEP compatibility
export const useGoogleAuth = () => {
  const { loginWithCredential } = useAuth()
  const config = useRuntimeConfig()

  const waitForGoogleScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (process.server) {
        reject(new Error('Google Auth not available on server'))
        return
      }

      if (window.google?.accounts?.id) {
        resolve()
        return
      }

      let attempts = 0
      const maxAttempts = 50
      
      const checkGoogle = () => {
        attempts++
        
        if (window.google?.accounts?.id) {
          resolve()
        } else if (attempts >= maxAttempts) {
          reject(new Error('Google Identity Services failed to load'))
        } else {
          setTimeout(checkGoogle, 100)
        }
      }
      
      checkGoogle()
    })
  }

  const initializeGoogleAuth = async (): Promise<void> => {
    if (process.server) return

    try {
      await waitForGoogleScript()
      
      const clientId = config.public.googleClientId
        if (!clientId) {
        throw new Error('Google Client ID not configured')
      }
      
      if (window.google?.accounts?.id) {        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          hosted_domain: 'gbox.adnu.edu.ph'
        })
      } else {
        throw new Error('Google Identity Services not available')
      }

      console.log('Google Auth initialized successfully')
    } catch (error) {
      console.error('Google Auth initialization failed:', error)
      throw error
    }
  }

  const handleCredentialResponse = async (response: any) => {
    try {
      console.log('Received credential response')
      
      const result = await loginWithCredential(response.credential)
      
      console.log('Authentication successful:', result)
      
      // Redirect based on whether it's a new user
      if (result.isNew) {
        await navigateTo('/profile-setup')      } else {
        await navigateTo('/modes')
      }
    } catch (error) {
      console.error('Authentication failed:', error)
      throw error
    }
  }

  const signIn = () => {
    if (process.server) return

    try {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.prompt()
      } else {
        throw new Error('Google Auth not initialized')
      }
    } catch (error) {
      console.error('Sign-in failed:', error)
      throw error
    }
  }

  const renderButton = (elementId: string) => {
    if (process.server) return Promise.resolve()

    return new Promise<void>((resolve, reject) => {
      const tryRender = () => {
        const element = document.getElementById(elementId)
        
        if (!element) {
          reject(new Error(`Element with id '${elementId}' not found`))
          return
        }

        if (!window.google?.accounts?.id) {
          reject(new Error('Google Auth not initialized'))
          return
        }

        try {
          window.google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'large',
            width: element.offsetWidth || 300,
            text: 'signin_with',
            shape: 'rectangular'
          })
          resolve()
        } catch (error) {
          reject(error)
        }
      }

      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryRender)
      } else {
        tryRender()
      }
    })
  }

  return {
    initializeGoogleAuth,
    signIn,
    renderButton,
    handleCredentialResponse
  }
}

// Global type declarations for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: any) => void
          prompt: (callback?: (notification: any) => void) => void
          renderButton: (element: HTMLElement, config: any) => void
          disableAutoSelect: () => void
          storeCredential: (credential: any) => void
          cancel: () => void
        }
      }
    }
  }
}
