import { tapByText } from '../utils/helpers.js'

async function isLoggedIn() {
    await driver.pause(3000)
    const source = await driver.getPageSource()
    return source.includes('Good ')
}

async function waitForHomeScreen(maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const source = await driver.getPageSource()
        if (source.includes('Good ')) return true
        await driver.pause(1000)
    }
    return false
}

async function goHome() {
    const homeTapped = await tapByText('Home', 3)
    if (homeTapped) {
        await driver.pause(3000)
        return true
    }
    console.log('Home tab not found, pressing device back button...')
    await driver.back()
    await driver.pause(3000)
    const onHome = await waitForHomeScreen(15)
    console.log('Back on home screen:', onHome)
    return onHome
}

export { isLoggedIn, waitForHomeScreen, goHome }
