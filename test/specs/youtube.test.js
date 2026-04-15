import { expect } from '@wdio/globals'

describe('GolfLoverz App Test', () => {
    it('should launch the app and explore basic navigation', async () => {
        const packageName = await driver.executeScript('mobile: getCurrentPackage', [])
        console.log(`Current app: ${packageName}`)
        
        expect(packageName).toBe('com.golfloverz.app')
        
        await driver.pause(3000)
        
        const pageSource = await driver.getPageSource()
        console.log(`Page source length: ${pageSource.length}`)
        
        const hasNativeElements = pageSource.includes('android.widget')
        console.log(`Has native Android elements: ${hasNativeElements}`)
        
        const clickableElements = await $$('android=new UiSelector().clickable(true)')
        console.log(`Found ${clickableElements.length} clickable elements`)
        
        const textElements = await $$('android=new UiSelector().text("")')
        console.log(`Found ${textElements.length} text elements`)
        
        console.log('Exploring all clickable elements...')
        for (let i = 0; i < Math.min(clickableElements.length, 5); i++) {
            try {
                const text = await clickableElements[i].getText().catch(() => '')
                const desc = await clickableElements[i].getAttribute('content-desc').catch(() => '')
                console.log(`Element ${i}: text="${text}", desc="${desc}"`)
            } catch (e) {
                console.log(`Element ${i}: unable to read`)
            }
        }
        
        expect(packageName).toBe('com.golfloverz.app')
        console.log('Test passed: GolfLoverz app launched successfully')
    })
    
    it('should verify app is in foreground', async () => {
        const packageName = await driver.executeScript('mobile: getCurrentPackage', [])
        const appState = await driver.executeScript('mobile: queryAppState', [{ appId: 'com.golfloverz.app' }])
        
        console.log(`App state: ${appState} (4 = foreground)`)
        expect(appState).toBe(4)
        expect(packageName).toBe('com.golfloverz.app')
    })
    
    it('should find and display UI elements', async () => {
        const allViews = await $$('android=new UiSelector().className("android.view.View")')
        console.log(`Found ${allViews.length} View elements`)
        
        const buttons = await $$('android=new UiSelector().className("android.widget.Button")')
        console.log(`Found ${buttons.length} Button elements`)
        
        const textViews = await $$('android=new UiSelector().className("android.widget.TextView")')
        console.log(`Found ${textViews.length} TextView elements`)
        
        for (let i = 0; i < Math.min(textViews.length, 10); i++) {
            try {
                const text = await textViews[i].getText().catch(() => '')
                if (text && text.length > 0) {
                    console.log(`TextView ${i}: "${text}"`)
                }
            } catch (e) {
                // ignore
            }
        }
        
        expect(textViews.length).toBeGreaterThan(0)
    })
})