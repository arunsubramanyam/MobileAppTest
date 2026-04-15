import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CRED_FILE = path.join(__dirname, '../../test-data/credentials.json')

export function saveCredentials(name, email, password) {
    const dir = path.dirname(CRED_FILE)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(CRED_FILE, JSON.stringify({ name, email, password }))
}

export function getCredentials() {
    if (fs.existsSync(CRED_FILE)) {
        const data = fs.readFileSync(CRED_FILE, 'utf8')
        return JSON.parse(data)
    }
    return null
}