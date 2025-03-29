import type { InitxContext, InitxMatcherRules } from '@initx-plugin/core'
import path from 'node:path'
import process from 'node:process'
import { InitxPlugin } from '@initx-plugin/core'
import { c, gpgList, inquirer, log } from '@initx-plugin/utils'

import fs from 'fs-extra'

export default class GpgPlugin extends InitxPlugin {
  rules: InitxMatcherRules = {
    matching: 'gpg',
    description: 'GPG key management',
    optional: [
      'import',
      'export',
      'delete'
    ]
  }

  async handle(_ctx: InitxContext, type: string, ...others: string[]) {
    if (!type) {
      log.error('Please enter a type, import or export')
      return
    }

    switch (type) {
      case 'import': {
        await this.importKey()
        break
      }

      case 'export': {
        const key = await this.findKey()

        if (!key) {
          log.error('No GPG keys found')
          return
        }

        const [filename] = others
        await this.exportKey(key, filename)

        break
      }

      case 'delete': {
        const key = await this.findKey()

        if (!key) {
          log.error('No GPG keys found')
          return
        }

        const [deleteType] = others

        await this.deleteKey(key, deleteType)
        break
      }
    }
  }

  async findKey() {
    const list = await gpgList()

    if (list.length === 0) {
      return null
    }

    if (list.length === 1) {
      const [firstKey] = list
      return firstKey.key
    }

    return await inquirer.select('Select a GPG key to export', list.map(gpg => ({
      name: `${gpg.name} <${gpg.email}> [${gpg.key}]`,
      value: gpg.key
    })))
  }

  async importKey() {
    const dir = fs.readdirSync(process.cwd())
    const publicKeys = dir.filter(file => file.endsWith('public.key'))
    const privateKeys = dir.filter(file => file.endsWith('private.key'))

    const keys = [...publicKeys, ...privateKeys]

    if (keys.length === 0) {
      log.error('No matching key file found')
      return
    }

    for (const key of keys) {
      const keyPath = path.join(process.cwd(), key)
      log.info(`Importing GPG key from "${key}"`)
      await c('gpg', ['--import', keyPath])
    }
  }

  async exportKey(key: string, filename?: string) {
    const publicKeyName = filename ? `${filename}_public.key` : 'public.key'
    const privateKeyName = filename ? `${filename}_private.key` : 'private.key'

    const publicKeyPath = path.join(process.cwd(), publicKeyName)
    const privateKeyPath = path.join(process.cwd(), privateKeyName)

    if (fs.existsSync(publicKeyPath) || fs.existsSync(privateKeyPath)) {
      const overwrite = await inquirer.confirm(
        `Key file "${publicKeyName}" or "${privateKeyName}" already exists, overwrite?`
      )

      if (!overwrite) {
        return
      }

      // remove existing key files
      if (fs.existsSync(publicKeyPath)) {
        fs.unlinkSync(publicKeyPath)
      }

      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath)
      }
    }

    await c('gpg', ['--armor', '--output', publicKeyPath, '--export', key])
    await c('gpg', ['--armor', '--output', privateKeyPath, '--export-secret-keys', key])

    if (!fs.existsSync(privateKeyPath) || !fs.existsSync(publicKeyPath)) {
      log.error('Error exporting GPG keys')
      return
    }

    log.success(`GPG keys exported to "${publicKeyName}" and "${privateKeyName}"`)
  }

  async deleteKey(key: string, deleteType?: string) {
    const hasDeleteType = !!(deleteType && ~['public', 'private'].indexOf(deleteType))

    const confirm = await inquirer.confirm(
      `Are you sure you want to delete the${hasDeleteType ? ` ${deleteType}` : ''} key "${key}"?`
    )

    if (!confirm) {
      return
    }

    if (!hasDeleteType || deleteType === 'private') {
      await c('gpg', ['--delete-secret-keys', key], {
        nodeOptions: {
          stdio: 'inherit'
        }
      })
    }

    if (!hasDeleteType || deleteType === 'public') {
      await c('gpg', ['--delete-keys', key], {
        nodeOptions: {
          stdio: 'inherit'
        }
      })
    }
  }
}
