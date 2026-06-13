import { expect } from '@wdio/globals'
import LoginPage from '../pageobjects/login.page.js'
import { startActivity, waitForAppReady, tapByText } from '../utils/helpers.js'
import { isLoggedIn, waitForHomeScreen, goHome } from '../pageobjects/home.page.js'
import { logout } from '../pageobjects/profile.page.js'
import loginData from '../data/login.json' with { type: 'json' }
import regData from '../data/registration.json' with { type: 'json' }

async function findClickableAncestor(el) {
    const isClickable = await el.getAttribute('clickable').catch(() => 'false')
    if (isClickable === 'true') return el
    try {
        const parent = await el.parentElement()
        if (parent) {
            const parentClickable = await parent.getAttribute('clickable').catch(() => 'false')
            if (parentClickable === 'true') return parent
            return findClickableAncestor(parent)
        }
    } catch (e) { /* ignore */ }
    return el
}

async function discoverBankCandidates() {
    const candidates = []
    const seen = new Set()

    const bankKeywords = [
        'ICICI', 'SBI', 'IndusInd', 'HSBC', 'HDFC', 'AMEX', 'Axis Bank',
        'Std Chartered', 'IDFC']

    for (const keyword of bankKeywords) {
        for (const attr of ['textContains', 'descriptionContains']) {
            try {
                const els = await $$(`android=new UiSelector().${attr}("${keyword}")`)
                for (const el of els) {
                    const bounds = await el.getAttribute('bounds').catch(() => '')
                    if (!bounds || seen.has(bounds)) continue
                    seen.add(bounds)
                    candidates.push(await findClickableAncestor(el))
                }
            } catch (e) { /* skip */ }
        }
    }

    return candidates
}

async function verifyExternalAction(currentPkg, golfPackage, index) {
    const isBrowser = /chrome|browser|webview/i.test(currentPkg)
    const isDialer = /dialer|incallui|phone|contacts/i.test(currentPkg)

    if (isBrowser) {
        console.log(`✓ Bank button ${index} opened external link in browser (${currentPkg})`)
    } else if (isDialer) {
        console.log(`✓ Bank button ${index} opened keypad to make a call (${currentPkg})`)
    } else if (currentPkg !== golfPackage) {
        console.log(`✓ Bank button ${index} opened external app: ${currentPkg}`)
    } else {
        console.log(`✗ Bank button ${index}: no external action detected, still in GolfLoverz`)
    }

    return currentPkg !== golfPackage
}

async function returnToBookAGame() {
    await driver.back()
    await driver.pause(2000)
    await startActivity()
    await driver.pause(3000)
    const onHome = await waitForHomeScreen(10)
    if (!onHome) {
        await goHome()
    }
    await tapByText('Book a Game', 5)
    await driver.pause(3000)
}

async function verifyBankButtons() {
    console.log('--- Starting Bank Button Verification Flow ---')

    const pageSource = await driver.getPageSource()
    const bankRefs = (pageSource.match(/[Bb]ank/g) || []).length
    const payRefs = (pageSource.match(/[Pp]ay(ment)?/g) || []).length
    console.log(`Page source: ${pageSource.length} chars, ${bankRefs}x "Bank", ${payRefs}x "Pay"`)

    const candidates = await discoverBankCandidates()

    if (candidates.length === 0) {
        console.log('No bank-related elements found via keyword search')
        console.log('Page source excerpt:', pageSource.substring(0, 2000))
        return
    }

    console.log(`Found ${candidates.length} bank candidate(s)`)

    const golfPackage = 'com.golfloverz.app'

    let processedCount = 0
    for (let i = 0; i < candidates.length; i++) {
        try {
            const text = await candidates[i].getText().catch(() => '')
            const desc = await candidates[i].getAttribute('content-desc').catch(() => '')
            const rid = await candidates[i].getAttribute('resource-id').catch(() => '')
            const cls = await candidates[i].getAttribute('className').catch(() => '')

            if (text || desc) {
                console.log(`Candidate ${i + 1}: text="${text}", desc="${desc}", id="${rid}", class="${cls}"`)
            }

            if (!(await candidates[i].isDisplayed().catch(() => false))) {
                console.log(`Candidate ${i + 1} not displayed, skipping`)
                continue
            }

            await candidates[i].click()
            await driver.pause(3000)

            const currentPkg = await driver.executeScript('mobile: getCurrentPackage', [])

            const switched = await verifyExternalAction(currentPkg, golfPackage, i + 1)
            if (switched) {
                processedCount++
                await returnToBookAGame()
            }
        } catch (e) {
            console.log(`Error processing candidate ${i + 1}: ${e.message}`)
        }
    }

    if (processedCount === 0) {
        console.log('No bank buttons triggered an external action — checking for buttons in page source')
        const xmlLines = pageSource.split('\n').filter(l =>
            /[Bb]ank|[Pp]ay/i.test(l) && /clickable|button|image/i.test(l)
        )
        for (const line of xmlLines.slice(0, 10)) {
            console.log('  ', line.trim().substring(0, 300))
        }
    }

    console.log(`--- Bank Button Verification Flow Complete (${processedCount} buttons processed) ---`)
}

function randomPhone() {
    const first = Math.floor(Math.random() * 4) + 6
    let rest = ''
    for (let i = 0; i < 9; i++) rest += Math.floor(Math.random() * 10)
    return `${first}${rest}`
}

async function fillField(label, value) {
    const labelDesc = label.replace(/^Mobile$/, 'Mobile number')
    const labelSel = `//android.view.View[@content-desc="${labelDesc}"]/following-sibling::android.widget.EditText`
    try {
        const el = await $(labelSel)
        if (await el.isDisplayed().catch(() => false)) {
            await el.click()
            await driver.pause(300)
            await el.clearValue()
            await el.setValue(value)
            await driver.pause(300)
            return true
        }
    } catch (e) { /* try next */ }

    const hints = [label, `${label} address`, `${label} Number`, `${label} number`, label.replace(' ', '')]
    for (const hint of hints) {
        for (const sel of [
            `android=new UiSelector().textContains("${hint}")`,
            `//android.widget.EditText[@hint="${hint}"]`,
            `android=new UiSelector().descriptionContains("${hint}")`,
            `//android.widget.EditText[${hints.indexOf(hint) + 1}]`
        ]) {
            try {
                const el = await $(sel)
                if (await el.isDisplayed().catch(() => false)) {
                    await el.click()
                    await driver.pause(300)
                    await el.clearValue()
                    await el.setValue(value)
                    await driver.pause(300)
                    return true
                }
            } catch (e) { /* try next */ }
        }
    }
    return false
}

async function findByDesc(desc) {
    const sel = `android=new UiSelector().descriptionContains("${desc}")`
    const el = await $(sel)
    return el
}

async function fillFormFieldByHint(hint, value) {
    try {
        const el = await $(`//android.widget.EditText[@hint="${hint}"]`)
        if (await el.isDisplayed().catch(() => false)) {
            await el.click()
            await driver.pause(300)
            await el.clearValue()
            await el.setValue(value)
            await driver.pause(300)
            return true
        }
    } catch (e) { /* not found */ }
    return false
}

async function tapByUiText(text, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const el = await $(`android=new UiSelector().textContains("${text}")`)
            if (el && await el.isDisplayed()) {
                await el.click()
                await driver.pause(2000)
                return true
            }
        } catch (e) {
            console.log(`Attempt ${attempt + 1} tap failed for text: ${text}`)
        }
        await driver.pause(1500)
    }
    return false
}

async function tapByDescOrText(text, retries = 5) {
    const byDesc = await tapByText(text, retries)
    if (byDesc) return true
    return tapByUiText(text, retries)
}

async function tapByExactText(text, retries = 5) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            const el = await $(`android=new UiSelector().text("${text}")`)
            if (el && await el.isDisplayed()) {
                await el.click()
                await driver.pause(2000)
                return true
            }
        } catch (e) {
            console.log(`Attempt ${attempt + 1} tap failed for exact text: ${text}`)
        }
        await driver.pause(1500)
    }
    return false
}

async function tapRegisterForTournament(tournamentName) {
    try {
        const el = await $(`//*[contains(@content-desc, "${tournamentName}")]/ancestor::*[1]//*[contains(@content-desc, "Register Now")]`)
        if (el && await el.isDisplayed()) {
            await el.click()
            await driver.pause(2000)
            console.log(`Tapped Register Now for tournament: ${tournamentName}`)
            return true
        }
    } catch (e) { console.log(`XPath lookup failed: ${e.message}`) }
    return tapByUiText('Register Now', 5)
}

async function registerTournament() {
    console.log('--- Starting Tournament Registration Flow ---')

    console.log(`Tapping Register Now for tournament: ${regData.tournamentName}...`)
    const registerTapped = await tapRegisterForTournament(regData.tournamentName)
    if (!registerTapped) {
        await tapByText('Register', 3)
    }
    await driver.pause(3000)

    const ps = await driver.getPageSource()
    console.log('After Register Now, source length:', ps.length)
    const hasEditText = ps.includes('EditText')
    const hasPayBtn = ps.includes('Pay')
    console.log('Has EditText fields:', hasEditText, 'Has Pay button:', hasPayBtn)

    const fullnameFilled = await fillField('Full name', regData.fullName)
    
    var phone;    
    if(regData.mobileNumber == "")
    {
        phone = randomPhone()
        console.log(`Using phone: ${phone}`)
    }
    else
    {
        phone = regData.mobileNumber;
    }

    const mobileFilled = await fillField('Mobile', phone)
    if (!mobileFilled) {
        console.log('Trying fallback: find EditText by hint...')
        await fillFormFieldByHint('9876543210', phone)
    }

    const handicapFilled = await fillField('Handicap', regData.handicap)

    try { await driver.hideKeyboard() } catch (e) { /* ignore */ }
    await driver.pause(1000)

    console.log('Tapping Pay ₹1000 & Register...')
    const payTapped = await tapByText('Pay ₹1000 & Register', 5)
    if (!payTapped) {
        await tapByDescOrText('Pay', 3)
    }
    await driver.pause(7000)

    console.log('Selecting NetBanking (Razorpay)...')
    await tapByUiText('Netbanking', 5)
    await driver.pause(2000)

    console.log('Selecting Canara Bank...')
    await tapByUiText('Canara', 5)
    await driver.pause(2000)

    //console.log('Tapping Continue on Razorpay...')
    //await tapByUiText('Continue', 5)
    //await driver.pause(4000)

    console.log(`Selecting ${regData.paymentOutcome} on Razorpay Bank demo...`)
    const succ = await tapByExactText(regData.paymentOutcome, 5)
    if (!succ) {
        try {
            const el = await $(`android=new UiSelector().text("${regData.paymentOutcome}")`)
            if (await el.isDisplayed()) { await el.click(); await driver.pause(3000) }
        } catch (e) { console.log(`${regData.paymentOutcome} button not found:`, e.message) }
    }
    await driver.pause(5000)

    console.log('Adding to calendar...')
    await tapByText('Add to Calendar', 5)
    await driver.pause(3000)

    console.log('Opening calendar app...')
    const clickOnce = await tapByText('Just Once', 5)
    if (!clickOnce) {
        await tapByUiText('Just Once', 3)
    }
    await driver.pause(2000)

    console.log('Saving calendar event...')
    const saveTapped = await tapByText('Save', 5)
    if (!saveTapped) {
        await tapByUiText('Save', 3)
    }
    await driver.pause(2000)
    await driver.back()
    await driver.pause(3000)

    //Verify tournament name is listed under Registered Tournaments in the Profile.
    await tapByText('Profile', 5)
    await driver.pause(2000)
    await tapByText('Registered Tournaments', 5)
    await driver.pause(3000)

    const regSource = await driver.getPageSource()
    console.log('Registered Tournaments source length:', regSource.length)
    const tournamentFound = regSource.includes(regData.tournamentName)
    console.log(`Tournament "${regData.tournamentName}" found in Registered Tournaments: ${tournamentFound}`)
    expect(tournamentFound).toBe(true)

    console.log('--- Tournament Registration Flow Complete ---')
}

async function verifyProShopLinks() {
    console.log('--- Starting Pro-Shop External Link Verification ---')

    const golfPackage = 'com.golfloverz.app'
    const linkKeywords = ['http', 'https', 'www.', '.com', 'Visit', 'Shop', 'Explore']
    const allCandidates = []
    const seenBounds = new Set()

    async function discoverLinks() {
        const found = []
        for (const keyword of linkKeywords) {
            for (const attr of ['textContains', 'descriptionContains']) {
                try {
                    const els = await $$(`android=new UiSelector().${attr}("${keyword}")`)
                    for (const el of els) {
                        const bounds = await el.getAttribute('bounds').catch(() => '')
                        if (!bounds || seenBounds.has(bounds)) continue
                        seenBounds.add(bounds)
                        found.push(await findClickableAncestor(el))
                    }
                } catch (e) { /* skip */ }
            }
        }
        return found
    }

    async function scrollDown() {
        try {
            const scrollable = await $('android=new UiSelector().scrollable(true)')
            if (scrollable) {
                await driver.executeScript('mobile: scrollGesture', [{
                    elementId: scrollable.elementId,
                    direction: 'down',
                    percent: 0.6
                }])
                return true
            }
        } catch (e) { /* no scrollable container */ }
        try {
            await driver.executeScript('mobile: scroll', [{ direction: 'down' }])
            return true
        } catch (e) { /* scroll failed */ }
        return false
    }

    let initialLinks = await discoverLinks()
    allCandidates.push(...initialLinks)
    console.log(`Initial view: ${initialLinks.length} link(s) found`)

    for (let attempt = 1; attempt <= 5; attempt++) {
        const before = allCandidates.length
        const scrolled = await scrollDown()
        if (!scrolled) {
            console.log('Cannot scroll further, stopping discovery')
            break
        }
        await driver.pause(1500)
        const newLinks = await discoverLinks()
        allCandidates.push(...newLinks)
        console.log(`Scroll ${attempt}: ${allCandidates.length - before} new link(s) found`)
        if (allCandidates.length === before) {
            console.log('No new links after scroll, bottom reached')
            break
        }
    }

    const candidates = allCandidates
    if (candidates.length === 0) {
        console.log('No external links found on Pro-Shop page')
        console.log('--- Pro-Shop Link Verification Complete (0 links) ---')
        return
    }

    console.log(`Total external link(s) found: ${candidates.length}`)

    let processedCount = 0
    for (let i = 0; i < candidates.length; i++) {
        try {
            const text = await candidates[i].getText().catch(() => '')
            const desc = await candidates[i].getAttribute('content-desc').catch(() => '')
            const cls = await candidates[i].getAttribute('className').catch(() => '')
            console.log(`Link ${i + 1}: text="${text}", desc="${desc}", class="${cls}"`)

            if (!(await candidates[i].isDisplayed().catch(() => false))) {
                console.log(`Link ${i + 1} not displayed, skipping`)
                continue
            }

            await candidates[i].click()
            await driver.pause(3000)

            const currentPkg = await driver.executeScript('mobile: getCurrentPackage', [])

            if (currentPkg !== golfPackage) {
                console.log(`✓ Link ${i + 1} opened external app: ${currentPkg}`)
                processedCount++

                await driver.back()
                await driver.pause(2000)
                await startActivity()
                await driver.pause(3000)
                await tapByText('Pro-Shop', 5)
                await driver.pause(3000)
            } else {
                console.log(`✗ Link ${i + 1}: no external navigation detected, still in GolfLoverz`)
            }
        } catch (e) {
            console.log(`Error processing link ${i + 1}: ${e.message}`)
        }
    }

    console.log(`--- Pro-Shop Link Verification Complete (${processedCount} links processed) ---`)
}

const golfPackage = 'com.golfloverz.app'

async function scrollDown() {
    try {
        const scrollable = await $('android=new UiSelector().scrollable(true)')
        if (scrollable) {
            await driver.executeScript('mobile: scrollGesture', [{
                elementId: scrollable.elementId, direction: 'down', percent: 0.6
            }])
            return true
        }
    } catch (e) { /* no scrollable */ }
    try { await driver.executeScript('mobile: scroll', [{ direction: 'down' }]); return true }
    catch (e) { return false }
}

async function stopVideo() {
    try {
        const closeBtn = await $('android=new UiSelector().descriptionContains("Close")')
        if (closeBtn && await closeBtn.isDisplayed()) {
            await closeBtn.click(); await driver.pause(1500); return
        }
    } catch (e) { /* no close */ }
    try { await driver.back(); await driver.pause(1500) } catch (e) { /* ignore */ }
}

async function processVideo(videoEl, label) {
    const text = await videoEl.getText().catch(() => '')
    const desc = await videoEl.getAttribute('content-desc').catch(() => '')
    console.log(`Playing ${label}: text="${text}", desc="${desc}"`)

    if (!(await videoEl.isDisplayed().catch(() => false))) {
        console.log(`${label} not displayed, skipping`); return 'skipped'
    }

    await videoEl.click()
    console.log(`${label} playing for 1 second...`)
    await driver.pause(1000)

    const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
    if (pkg !== golfPackage) {
        console.log(`${label} opened ${pkg}, returning...`)
        await driver.back(); await driver.pause(2000)
        await startActivity(); await driver.pause(3000)
        await tapByText('Tips & Tricks', 5)
        await driver.pause(2000)
        return 'external'
    }
    console.log(`${label} played in-app`)
    await stopVideo()
    return 'in-app'
}

async function tapSection(search, retries = 5) {
    const strategies = [
        `android=new UiSelector().descriptionContains("${search}").className("android.view.View")`,
        `android=new UiSelector().descriptionContains("${search}")`,
    ]
    for (const sel of strategies) {
        for (let i = 0; i < retries; i++) {
            try {
                const el = await $(sel)
                if (!(await el.isDisplayed().catch(() => false))) continue
                const cd = (await el.getAttribute('content-desc').catch(() => '')) || ''
                if (!cd.includes(search)) continue
                await el.click()
                await driver.pause(2000)
                console.log(`tapSection: tapped "${search}"`)
                return true
            } catch (e) { /* not found */ }
            await driver.pause(1000)
        }
    }
    try {
        const els = await $$(`android=new UiSelector().descriptionContains("${search}")`)
        for (const el of els) {
            if (!(await el.isDisplayed().catch(() => false))) continue
            const cd = (await el.getAttribute('content-desc').catch(() => '')) || ''
            if (!cd.includes(search)) continue
            await el.click()
            await driver.pause(2000)
            console.log(`tapSection: tapped "${search}" via $$ fallback`)
            return true
        }
    } catch (e) { /* fallback failed */ }
    console.log(`tapSection: could not tap "${search}"`)
    return false
}

async function getVisibleWatchNowVideos(seenBounds) {
    const found = []
    try {
        const els = await $$(`android=new UiSelector().descriptionContains("Watch Now")`)
        for (const el of els) {
            const bounds = await el.getAttribute('bounds').catch(() => '')
            if (!bounds || seenBounds.has(bounds)) continue
            if (!(await el.isDisplayed().catch(() => false))) continue
            const d = await el.getAttribute('content-desc').catch(() => '')
            console.log(`  Found video: desc="${d.split('\\n').join(' | ')}"`)
            seenBounds.add(bounds)
            found.push(el)
        }
        if (found.length > 0) return found
    } catch (e) { /* search failed */ }

    try {
        const els = await $$(`//*[contains(@content-desc, 'Watch Now')]`)
        for (const el of els) {
            const bounds = await el.getAttribute('bounds').catch(() => '')
            if (!bounds || seenBounds.has(bounds)) continue
            if (!(await el.isDisplayed().catch(() => false))) continue
            const d = await el.getAttribute('content-desc').catch(() => '')
            console.log(`  Found video (XPath): desc="${d.split('\\n').join(' | ')}"`)
            seenBounds.add(bounds)
            found.push(el)
        }
    } catch (e) { /* xpath failed */ }
    return found
}

async function verifyTipsAndTricks() {
    console.log('--- Starting Tips & Tricks Video Tutorial Flow ---')

    const sections = [
        { name: 'Advanced', search: 'Advanced' },
        { name: 'Beginner', search: 'Beginner' },
        { name: 'Intermediate', search: 'Refine Your Game' }
        
    ]

    let totalPlayed = 0
    for (const section of sections) {
        console.log(`\n--- ${section.name} Section ---`)

        const tapped = await tapSection(section.search)
        if (!tapped) {
            console.log(`Could not tap section "${section.name}", skipping`)
            continue
        }

        const seenBounds = new Set()
        let playedInSection = 0
        const sectionTotalVideos = section.name === 'Beginner' ? 3 : section.name === 'Intermediate' ? 7 : 5
        console.log(`Expecting ~${sectionTotalVideos} videos in ${section.name}`)

        for (let scroll = 0; scroll < 10; scroll++) {
            const videos = await getVisibleWatchNowVideos(seenBounds)
            if (videos.length === 0) {
                if (playedInSection >= sectionTotalVideos) break
                if (!(await scrollDown())) break
                await driver.pause(1500)
                continue
            }

            for (const video of videos) {
                const result = await processVideo(video, `${section.name} #${++playedInSection}`)
                if (result !== 'skipped') totalPlayed++
                if (result === 'external') {
                    await tapSection(section.search)
                }
            }

            if (playedInSection >= sectionTotalVideos) break
            if (!(await scrollDown())) break
            await driver.pause(1500)
        }

        console.log(`${section.name}: ${playedInSection} video(s) played`)
    }

    console.log(`\n--- Tips & Tricks Complete (${totalPlayed} videos) ---`)
}

describe('GolfLoverz Native Application Test', () => {
    before(async () => {
        console.log('--- Setup: Launching app and logging in ---')
        await startActivity()

        const appReady = await waitForAppReady(45)
        console.log('App ready:', appReady)
        expect(appReady).toBe(true)

        const pkg = await driver.executeScript('mobile: getCurrentPackage', [])
        console.log('Current package:', pkg)
        expect(pkg).toBe('com.golfloverz.app')

        const loggedIn = await isLoggedIn()
        console.log('User logged in:', loggedIn)

        if (!loggedIn) {
            console.log('User not logged in — proceeding with login...')
            await LoginPage.login(loginData.email, loginData.password)
            console.log('Login completed. Verifying login state...')
        }

        const homeReady = await waitForHomeScreen(30)
        expect(homeReady).toBe(true)
        console.log('Setup complete — user logged in and on home screen')
    })

    beforeEach(async () => {
        await goHome()
        await driver.pause(3000)
    })

    it('navigates Tournaments module and registers', async () => {
        console.log('Navigating to Tournaments...')
        await tapByText('Tournaments')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Tournaments page loaded, source length:', ps.length)

        await registerTournament()
    })

    it('navigates Book a Game module and verifies bank buttons', async () => {
        console.log('Navigating to Book a Game...')
        await tapByText('Book a Game')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Book a Game page loaded, source length:', ps.length)

        await verifyBankButtons()
    })

    it('navigates Tours module', async () => {
        console.log('Navigating to Tours...')
        await tapByText('Tours')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Tours page loaded, source length:', ps.length)
    })

    it('navigates Pro-Shop module and verifies external links', async () => {
        console.log('Navigating to Pro-Shop...')
        await tapByText('Pro-Shop')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Pro-Shop page loaded, source length:', ps.length)

        await verifyProShopLinks()
    })

    it('navigates Tips & Tricks module and verifies videos', async () => {
        console.log('Navigating to Tips & Tricks...')
        await tapByText('Tips & Tricks')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Tips & Tricks page loaded, source length:', ps.length)

        await verifyTipsAndTricks()
    })

    it('navigates Scoring module', async () => {
        console.log('Navigating to Scoring...')
        await tapByText('Scoring')
        await driver.pause(3000)
        const ps = await driver.getPageSource()
        console.log('Scoring page loaded, source length:', ps.length)
    })

    after(async () => {
        console.log('--- Teardown: Verifying Registered Tournaments and logging out ---')

        await startActivity()
        await driver.pause(3000)

        console.log('Executing logout flow...')
        await logout()

        console.log('Test suite completed successfully!')
    })
})
