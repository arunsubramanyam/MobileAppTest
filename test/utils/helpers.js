function selector(text) {
    return `android=new UiSelector().descriptionContains("${text}")`
}

async function tapByText(text, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const el = await $(selector(text))
            if (el && await el.isDisplayed()) {
                await el.click()
                await driver.pause(2000)
                return true
            }
        } catch (e) {
            console.log(`Attempt ${attempt + 1} tap failed for: ${text}`)
        }
        await driver.pause(1500)
    }
    return false
}

async function startActivity() {
    await driver.executeScript('mobile: startActivity', [{
        intent: 'com.golfloverz.app/com.golfloverz.app.MainActivity'
    }])
    await driver.pause(5000)
}

async function waitForAppReady(maxAttempts = 60) {
    for (let i = 0; i < maxAttempts; i++) {
        const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
        if (pkg === 'com.golfloverz.app') {
            await driver.pause(2000)
            const source = await driver.getPageSource()
            if (!source.includes('com.android.vending') && !source.includes('Play Store')) {
                return true
            }
        }
        await driver.pause(2000)
    }
    return false
}

export { selector, tapByText, startActivity, waitForAppReady }
