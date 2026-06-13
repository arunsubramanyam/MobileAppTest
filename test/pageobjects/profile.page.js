import { tapByText } from '../utils/helpers.js'

const logoutLabels = ['Logout', 'Sign Out', 'Log Out', 'Log out', 'Sign out', 'log out']

async function scrollDown() {
    try {
        await driver.executeScript('mobile: scrollGesture', [{
            left: 100, top: 500, width: 800, height: 800,
            direction: 'down', percent: 0.5
        }])
        await driver.pause(2000)
        return true
    } catch (e) {
        console.log('Scroll attempt failed:', e.message)
        return false
    }
}

async function tryTapLogout(retries = 2) {
    for (const label of logoutLabels) {
        const tapped = await tapByText(label, retries)
        if (tapped) {
            console.log(`Logout button "${label}" tapped`)
            return true
        }
    }
    return false
}

async function handleConfirmation() {
    const source = await driver.getPageSource()
    if (source.includes('Yes') || source.includes('Confirm') || source.includes('OK')) {
        console.log('Confirmation dialog detected, confirming logout...')
        await tapByText('Yes', 3) || await tapByText('Confirm', 3) || await tapByText('OK', 3)
        await driver.pause(3000)
    }
}

async function logout() {
    console.log('Navigating to Profile for logout...')
    await tapByText('Profile', 5)
    await driver.pause(3000)

    console.log('Logout not visible, scrolling down...')
    await scrollDown()

    const foundAfterScroll = await tryTapLogout(3)
    if (foundAfterScroll) {
        await handleConfirmation()
        return true
    }

    console.log('Dumping page source for debug...')
    const pageSource = await driver.getPageSource()
    const excerpt = pageSource.substring(0, 3000)
    console.log('Profile page source (first 3000 chars):', excerpt)

    console.log('No logout button found')
    return false
}

export { logout }
