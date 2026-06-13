import { expect } from '@wdio/globals'
import LoginPage from '../pageobjects/login.page.js'
import { startActivity, waitForAppReady, tapByText } from '../utils/helpers.js'
import { isLoggedIn, waitForHomeScreen } from '../pageobjects/home.page.js'
import { logout } from '../pageobjects/profile.page.js'
import { saveCredentials } from '../utils/credentials.js'

function generateRandomName() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    let name = ''
    for (let i = 0; i < 8; i++) {
        name += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return 'G L ' + name
}

function generateRandomEmail() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let email = ''
    for (let i = 0; i < 10; i++) {
        email += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return 'gl' + email + '@yopmail.com'
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let password = ''
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return 'gl' + password
}

describe('GolfLoverz Native Sign Up Flow', () => {
    let randomName, randomEmail, randomPassword

    it('completes full native signup, login and logout flow', async () => {
        randomName = generateRandomName()
        randomEmail = generateRandomEmail()
        randomPassword = generateRandomPassword()

        console.log(`Generated credentials - Name: ${randomName}, Email: ${randomEmail}`)

        // Step 1: Launch the app
        await startActivity()
        const appReady = await waitForAppReady(45)
        expect(appReady).toBe(true)

        const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
        console.log('Current package:', pkg)
        expect(pkg).toBe('com.golfloverz.app')

        // Ensure logged out before starting signup
        if (await isLoggedIn()) {
            console.log('User already logged in, logging out first...')
            await logout()
            await driver.pause(3000)
        }

        // Step 2: Go to Profile
        await tapByText('Profile', 5)
        await driver.pause(2000)

        // Step 3: Select 'Create an account'
        await tapByText('Create an account', 5)
        await driver.pause(2000)

        // Step 4: Fill Full Name
        const nameInput = await $('//android.widget.EditText[@hint="John Doe"]')
        await nameInput.waitForDisplayed({ timeout: 10000 })
        await nameInput.click()
        await driver.pause(300)
        await nameInput.setValue(randomName)
        await driver.pause(300)

        // Fill Email
        const emailInput = await $('//android.widget.EditText[@hint="you@example.com"]')
        await emailInput.waitForDisplayed({ timeout: 10000 })
        await emailInput.click()
        await driver.pause(300)
        await emailInput.setValue(randomEmail)
        await driver.pause(300)

        // Fill Password
        let passwordInput = await $('//android.widget.EditText[@password="true"]')
        if (!(await passwordInput.isDisplayed().catch(() => false))) {
            passwordInput = await $('//android.widget.EditText[contains(@hint, "assword")]')
        }
        if (!(await passwordInput.isDisplayed().catch(() => false))) {
            passwordInput = await $('//android.widget.EditText[contains(@hint, "........")]')
        }
        if (!(await passwordInput.isDisplayed().catch(() => false))) {
            const editTexts = await $$('//android.widget.EditText')
            passwordInput = editTexts[editTexts.length - 1]
        }
        await passwordInput.waitForDisplayed({ timeout: 10000 })
        await passwordInput.click()
        await driver.pause(300)
        await passwordInput.setValue(randomPassword)
        await driver.pause(300)

        try { await driver.hideKeyboard() } catch (e) { /* ignore */ }
        await driver.pause(1000)

        // Step 5: Accept Privacy Policy radio button
        let privacyAccepted = false
        for (const sel of [
            `//android.widget.RadioButton`,
            `//android.widget.CheckBox`,
            `//*[@checkable="true"]`
        ]) {
            try {
                const els = await $$(sel)
                for (const el of els) {
                    if (await el.isDisplayed().catch(() => false)) {
                        await el.click()
                        await driver.pause(1000)
                        privacyAccepted = true
                        console.log('Privacy policy radio button selected')
                        break
                    }
                }
                if (privacyAccepted) break
            } catch (e) { /* try next */ }
        }

        // Fallback: tap Privacy Policy text itself
        if (!privacyAccepted) {
            console.log('Tapping Privacy Policy text as fallback...')
            const tapped = await tapByText('Privacy Policy', 3)
            if (tapped) await driver.pause(1000)
        }

        await driver.pause(500)

        // Step 6: Click 'Create account'
        await tapByText('Create account', 5)
        await driver.pause(5000)

        // Step 7: Save the Credentials
        saveCredentials(randomName, randomEmail, randomPassword)
        console.log('Credentials saved to file')

        // Step 8: Log out
        await logout()
        
        // Step 9: Sign in with new credentials
        console.log('Signing in with new credentials...')
        await LoginPage.login(randomEmail, randomPassword)
        await driver.pause(3000)

        // Verify home page screen
        const homeReady = await waitForHomeScreen(30)
        expect(homeReady).toBe(true)
        console.log('Home screen verified after login')

        // Log out
        await logout()
        console.log('Test completed successfully!')
    })
})
