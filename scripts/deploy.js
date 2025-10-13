#!/usr/bin/env node

/**
 * Production deployment script for AdNU Chess Platform
 * Handles build, deployment, and health checks
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString()
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
  console.log(`${prefix} [${timestamp}] ${message}`)
}

const execCommand = (command, description) => {
  log(`Running: ${description}`)
  try {
    const output = execSync(command, { 
      stdio: 'inherit',
      encoding: 'utf8',
      cwd: process.cwd()
    })
    log(`✅ ${description} completed`, 'success')
    return output
  } catch (error) {
    log(`❌ ${description} failed: ${error.message}`, 'error')
    throw error
  }
}

const healthCheck = async (maxRetries = 5, delay = 3000) => {
  log('Performing health check...')
  
  for (let i = 1; i <= maxRetries; i++) {
    try {
      execSync('curl -f http://localhost:3000/api/health', { 
        stdio: 'pipe',
        timeout: 10000 
      })
      log('Health check passed!', 'success')
      return true
    } catch (error) {
      log(`Health check attempt ${i}/${maxRetries} failed`)
      if (i < maxRetries) {
        log(`Waiting ${delay/1000}s before next attempt...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw new Error('Health check failed after all retries')
}

const main = async () => {
  try {
    log('🚀 Starting production deployment...')
    
    // Pre-deployment checks
    log('Performing pre-deployment checks...')
    
    // Check if required files exist
    const requiredFiles = [
      'nuxt.config.ts',
      'package.json',
      'ecosystem.config.js'
    ]
    
    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        throw new Error(`Required file missing: ${file}`)
      }
    }
    
    // Check environment
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production'
    }
    
    // Create necessary directories
    const dirs = ['logs', 'backups']
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
        log(`Created directory: ${dir}`)
      }
    }
    
    // Backup current deployment (if exists)
    try {
      execCommand('npm run backup:db', 'Creating backup')
    } catch (error) {
      log('Backup failed, but continuing with deployment...', 'error')
    }
    
    // Install/update dependencies
    execCommand('npm ci --production', 'Installing production dependencies')
    
    // Run Convex deployment
    if (process.env.CONVEX_DEPLOY_KEY) {
      log('Deploying Convex functions...')
      execCommand('npm run convex:deploy', 'Convex deployment')
    } else {
      log('⚠️ CONVEX_DEPLOY_KEY not found, skipping Convex deployment')
    }
    
    // Build application
    execCommand('npm run build', 'Building application')
    
    // Stop existing PM2 process (if running)
    try {
      execCommand('npm run pm2:stop', 'Stopping existing PM2 process')
    } catch (error) {
      log('No existing PM2 process to stop (this is fine for first deployment)')
    }
    
    // Start with PM2
    execCommand('npm run pm2:start', 'Starting application with PM2')
    
    // Wait for application to start
    log('Waiting for application to start...')
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Health check
    await healthCheck()
    
    // Save deployment info
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      version: JSON.parse(fs.readFileSync('package.json')).version || '1.0.0',
      nodeVersion: process.version,
      commit: process.env.GIT_COMMIT || 'unknown',
      branch: process.env.GIT_BRANCH || 'unknown',
      deployedBy: process.env.USER || process.env.USERNAME || 'unknown'
    }
    
    fs.writeFileSync(
      'deployment-info.json',
      JSON.stringify(deploymentInfo, null, 2)
    )
    
    log('🎉 Deployment completed successfully!', 'success')
    log(`Version: ${deploymentInfo.version}`)
    log(`Application is running at: http://localhost:3000`)
    log(`Health endpoint: http://localhost:3000/api/health`)
    
  } catch (error) {
    log(`💥 Deployment failed: ${error.message}`, 'error')
    
    // Attempt to show PM2 status for debugging
    try {
      execSync('npm run pm2:status', { stdio: 'inherit' })
    } catch (e) {
      log('Could not show PM2 status')
    }
    
    process.exit(1)
  }
}

// Run deployment
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error')
  process.exit(1)
})
