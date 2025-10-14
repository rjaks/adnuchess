import { OAuth2Client } from 'google-auth-library'
import { useRuntimeConfig } from '#imports'
import { createError, defineEventHandler, readBody, setCookie } from 'h3'
import { createSession } from '~/server/utils/sessionStore'
import { upsertGoogleUser } from '~/server/utils/userStore'

const DOMAIN = 'gbox.adnu.edu.ph'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const clientId = config.googleClientId || config.public.googleClientId

  if (!clientId) {
    throw createError({ statusCode: 500, statusMessage: 'Google client ID is not configured.' })
  }

  const body = await readBody<{ credential?: string }>(event)

  if (!body?.credential) {
    throw createError({ statusCode: 400, statusMessage: 'Missing Google credential.' })
  }

  const oauthClient = new OAuth2Client(clientId)

  const ticket = await oauthClient.verifyIdToken({ idToken: body.credential, audience: clientId })
  const payload = ticket.getPayload()

  if (!payload) {
    throw createError({ statusCode: 401, statusMessage: 'Unable to verify Google credential.' })
  }

  if (!payload.email || !payload.email_verified) {
    throw createError({ statusCode: 403, statusMessage: 'Your Google account must be verified.' })
  }

  const hostedDomain = (payload.hd || '').toLowerCase()
  console.log('Debug auth - Email:', payload.email, 'Hosted Domain:', hostedDomain, 'Expected:', DOMAIN)
  
  if (hostedDomain !== DOMAIN) {
    throw createError({ 
      statusCode: 403, 
      statusMessage: `Please sign in with your AdNU gbox email. Got domain: ${hostedDomain}, expected: ${DOMAIN}` 
    })
  }

  try {
    console.log('🔄 Creating/updating user for:', payload.email)
    
    const { user, isNew } = await upsertGoogleUser({
      id: payload.sub || payload.email,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    })
    
    console.log('👤 User upsert result:', { userId: user.id, isNew, email: user.email })

    const session = await createSession({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    })
    
    console.log('🔑 Session created:', session.id)

    const secure = process.env.NODE_ENV === 'production'
    const runtimeConfig = useRuntimeConfig()
    const ttlDays = runtimeConfig.sessionTtlDays || 7
    const maxAge = 60 * 60 * 24 * ttlDays // Match session TTL
    
    setCookie(event, 'adnu_session', session.id, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge,
      path: '/',
    })
    
    console.log('🍪 Session cookie set for user:', user.id)
    console.log('📤 Returning response:', { user: { id: user.id, email: user.email }, isNew })

    return { user, isNew }
    
  } catch (error) {
    console.error('❌ Error in user creation/session setup:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error during user setup'
    })
  }
})
