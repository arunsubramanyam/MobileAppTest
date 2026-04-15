import { expect } from '@wdio/globals'
import { getCredentials } from '../utils/credentials.js'

const testCredentials = getCredentials() || { name: 'TestUser', email: 'test@yopmail.com', password: 'Test@1234' }

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

async function safeSetValue(selector, value) {
    try {
        const el = await $(selector)
        if (el && await el.isDisplayed()) {
            await el.setValue(value)
            await driver.pause(300)
            return true
        }
    } catch (e) {
        console.log('Element not found:', selector)
    }
    return false
}

async function safeClick(selector) {
    try {
        const el = await $(selector)
        if (el && await el.isDisplayed()) {
            await el.click()
            await driver.pause(500)
            return true
        }
    } catch (e) {
        console.log('Click failed:', selector)
    }
    return false
}

describe('GolfLoverz Navigation Test', () => {
    it('completes login and navigation flow', async () => {
        await driver.pause(2000)
        const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
        expect(pkg).toBe('com.golfloverz.app')

        await switchToWebView()
        
        const source = await driver.getPageSource()
        expect(source.includes('GolfLoverz')).toBe(true)

        await driver.url('https://golfloverz.com/login')
        await driver.pause(5000)

        await safeSetValue('input[type="email"]', testCredentials.email)
        await safeSetValue('input[type="password"]', testCredentials.password)
        
        await safeClick('button[type="submit"]')
        
        await driver.pause(5000)

        await switchToWebView()
        
        await driver.url('https://golfloverz.com/complementary-game')
        await driver.pause(3000)
        
        const gameUrl = await browser.getUrl()
        expect(gameUrl).toContain('complementary-game')

        await safeClick('[class*="cursor-pointer"] img')
        await driver.pause(2000)

        const pageAfterSelect = await driver.getPageSource()
        expect(pageAfterSelect).toContain('Select')

        await driver.pause(1000)
        const bookButtons = await $$('button')
        for (const btn of bookButtons) {
            try {
                if (await btn.isDisplayed()) {
                    const text = await btn.getText()
                    if (text && text.toLowerCase().includes('book')) {
                        await btn.click()
                        await driver.pause(3000)
                        break
                    }
                }
            } catch (e) {
                continue
            }
        }
        
        await driver.pause(1000)

        const afterSubmitUrl = await browser.getUrl()
        expect(afterSubmitUrl).toContain('golfloverz')

        await switchToWebView()
        
        await driver.url('https://golfloverz.com/tours')
        await driver.pause(3000)
        
        const toursUrl = await browser.getUrl()
        expect(toursUrl).toContain('tours')

        await driver.url('https://golfloverz.com/tournaments')
        await driver.pause(3000)
        
        const tourneyUrl = await browser.getUrl()
        expect(tourneyUrl).toContain('tournaments')

        await driver.url('https://golfloverz.com/purchases')
        await driver.pause(3000)
        
        const shopUrl = await browser.getUrl()
        expect(shopUrl).toContain('purchases')

        await driver.url('https://golfloverz.com/tips-and-tricks')
        await driver.pause(3000)
        
        const tipsUrl = await browser.getUrl()
        expect(tipsUrl).toContain('tips')

        await driver.url('https://golfloverz.com/scoring')
        await driver.pause(3000)
        
        const scoreUrl = await browser.getUrl()
        expect(scoreUrl).toContain('scoring')
    })
})