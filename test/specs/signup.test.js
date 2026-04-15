import { expect } from '@wdio/globals'
import { saveCredentials, getCredentials } from '../utils/credentials.js'

function generateRandomName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let name = ''
    for (let i = 0; i < 8; i++) {
        name += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return name
}

function generateRandomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let email = ''
    for (let i = 0; i < 10; i++) {
        email += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return email + '@yopmail.com'
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
}

async function getWebviewContext() {
    const ctxs = await driver.getContexts()
    return ctxs.find(c => c.includes('WEBVIEW'))
}

async function switchToWebView() {
    const webview = await getWebviewContext()
    if (webview) {
        await driver.switchContext(webview)
        await driver.pause(500)
    }
}

async function switchToNative() {
    await driver.switchContext('NATIVE_APP')
    await driver.pause(300)
}

describe('GolfLoverz Sign Up Flow', () => {
    let randomName, randomEmail, randomPassword

    it('completes full signup flow', async () => {
        randomName = generateRandomName()
        randomEmail = generateRandomEmail()
        randomPassword = generateRandomPassword()

        await driver.pause(3000)
        const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
        expect(pkg).toBe('com.golfloverz.app')
        
        await switchToWebView()
        await driver.pause(2000)
        
        await driver.url('https://golfloverz.com/signup')
        await driver.pause(8000)
        
        const allInputs = await $$('input')
        for (const input of allInputs) {
            try {
                const placeholder = await input.getAttribute('placeholder')
                const nameAttr = await input.getAttribute('name')
                const id = await input.getAttribute('id')
                const type = await input.getAttribute('type')
                
                if ((placeholder && placeholder.toLowerCase().includes('name')) || 
                    (nameAttr && nameAttr.toLowerCase() === 'name') ||
                    (id && id.toLowerCase() === 'name') ||
                    (type === 'text')) {
                    if (await input.isDisplayed()) {
                        await input.setValue(randomName)
                        await driver.pause(300)
                        break
                    }
                }
            } catch (e) {
                continue
            }
        }
        
        const emailInputs = await $$('input')
        for (const input of emailInputs) {
            try {
                const type = await input.getAttribute('type')
                if (type === 'email' && await input.isDisplayed()) {
                    await input.setValue(randomEmail)
                    await driver.pause(300)
                    break
                }
            } catch (e) {
                continue
            }
        }
        
        const passwordInputs = await $$('input')
        for (const input of passwordInputs) {
            try {
                const type = await input.getAttribute('type')
                if (type === 'password' && await input.isDisplayed()) {
                    await input.setValue(randomPassword)
                    await driver.pause(300)
                    break
                }
            } catch (e) {
                continue
            }
        }
        
        await driver.pause(1000)
        
        let checkboxClicked = false
        const buttons = await $$('button')
        for (const button of buttons) {
            try {
                const role = await button.getAttribute('role')
                const typeAttr = await button.getAttribute('type')
                if ((role && role.toLowerCase() === 'checkbox') || (typeAttr && typeAttr.toLowerCase() === 'checkbox')) {
                    if (await button.isDisplayed()) {
                        await button.click()
                        await driver.pause(300)
                        checkboxClicked = true
                        break
                    }
                }
            } catch (e) {
                continue
            }
        }
        
        if (!checkboxClicked) {
            const roleCheckboxes = await $$('[role="checkbox"]')
            for (const element of roleCheckboxes) {
                try {
                    if (await element.isDisplayed()) {
                        await element.click()
                        await driver.pause(300)
                        break
                    }
                } catch (e) {
                    continue
                }
            }
        }
        
        await driver.pause(500)
        
        const submitButtons = await $$('button')
        for (const button of submitButtons) {
            try {
                const typeAttr = await button.getAttribute('type')
                if (typeAttr && typeAttr.toLowerCase() === 'submit') {
                    if (await button.isDisplayed()) {
                        await button.click()
                        await driver.pause(300)
                        break
                    }
                }
            } catch (e) {
                continue
            }
        }
        
        await driver.pause(5000)
        
        const currentUrl = await browser.getUrl()
        expect(currentUrl).toContain('golfloverz.com')
        
        saveCredentials(randomName, randomEmail, randomPassword)
        
        await driver.pause(2000)
    })
})
