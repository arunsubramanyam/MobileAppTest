class LoginPage {
    get emailInput() {
        return $('//android.widget.EditText[@hint="Email address"]')
    }
    get passwordInput() {
        return $('//android.widget.EditText[@hint="Password"]')
    }
    get loginButton() {
        return $(`android=new UiSelector().description("Login")`)
    }

    async selectByText(text, retries = 5) {
        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const el = await $(`android=new UiSelector().descriptionContains("${text}")`)
                if (el && await el.isDisplayed()) {
                    await el.click()
                    await driver.pause(2000)
                    return true
                }
            } catch (e) {
                console.log(`Attempt ${attempt + 1} failed for: ${text}`)
            }
            await driver.pause(1500)
        }
        return false
    }

    async enterEmail(email) {
        const el = await this.emailInput
        await el.waitForDisplayed({ timeout: 10000 })
        await el.click()
        await driver.pause(500)
        await el.setValue(email)
        await driver.pause(500)
    }

    async enterPassword(password) {
        const el = await this.passwordInput
        await el.waitForDisplayed({ timeout: 10000 })
        await el.click()
        await driver.pause(500)
        await el.setValue(password)
        await driver.pause(1000)
        try {
            await driver.hideKeyboard()
            console.log('Keyboard dismissed')
        } catch {
            console.log('No keyboard to dismiss')
        }
        await driver.pause(1000)
    }

    async tapLogin() {
        return this.selectByText('Login', 15)
    }

    async isOnLoginScreen() {
        try {
            const el = await this.emailInput
            return await el.isDisplayed()
        } catch {
            return false
        }
    }

    async login(email, password) {
        const onLoginScreen = await this.isOnLoginScreen()
        if (!onLoginScreen) {
            const tapped = await this.selectByText('Sign In')
            if (!tapped) {
                console.log('Sign In not found — user may already be logged in.')
                return false
            }
            await driver.pause(2000)
        }

        console.log('Entering email...')
        await this.enterEmail(email)
        console.log('Entering password...')
        await this.enterPassword(password)
        console.log('Tapping Login button...')
        await this.tapLogin()
        await driver.pause(5000)
        return true
    }
}

export default new LoginPage()
