import { expect } from '@wdio/globals'

const contacts = [
    { firstName: 'John', lastName: 'Doe', phone: '+1234567890', email: 'john.doe@test.com' },
    { firstName: 'Jane', lastName: 'Smith', phone: '+1987654321', email: 'jane.smith@test.com' },
    { firstName: 'Bob', lastName: 'Wilson', phone: '+1555123456', email: 'bob.wilson@test.com' },
    { firstName: 'Alice', lastName: 'Brown', phone: '+1555987654', email: 'alice.brown@test.com' },
    { firstName: 'Charlie', lastName: 'Davis', phone: '+1555743210', email: 'charlie.davis@test.com' }
]

describe('Google Contacts App Test', () => {
    beforeEach(async () => {
        const curPackage = await driver.executeScript('mobile: getCurrentPackage', [])
        if (curPackage !== 'com.google.android.contacts') {
            await driver.startActivity({
                appPackage: 'com.google.android.contacts',
                appActivity: 'com.android.contacts.activities.PeopleActivity'
            })
        } else {
            try {
                const backBtn = await $('android=new UiSelector().description("Navigate up")')
                if (await backBtn.isDisplayed().catch(() => false)) {
                    await backBtn.click()
                    await driver.pause(500)
                }
            } catch (e) {}
        }
        
        await driver.pause(2000)
    })

    it('should verify Contacts app is running', async () => {
        const packageName = await driver.executeScript('mobile: getCurrentPackage', [])
        console.log(`Current app: ${packageName}`)
        
        expect(packageName).toBe('com.google.android.contacts')
    })

    contacts.forEach((contact, index) => {
        it(`should create contact: ${contact.firstName} ${contact.lastName}`, async () => {
            await driver.pause(1000)

            const addButton = await $('android=new UiSelector().description("Create contact")')
            const displayed = await addButton.isDisplayed().catch(() => false)
            console.log(`Create contact button displayed: ${displayed}`)

            if (displayed) {
                await addButton.click()
                await driver.pause(2000)
            }

            const firstNameField = await $('android=new UiSelector().text("First name")')
            const firstNameDisplayed = await firstNameField.isDisplayed().catch(() => false)

            if (firstNameDisplayed) {
                await firstNameField.setValue(contact.firstName)
                console.log(`Entered First name: ${contact.firstName}`)
            }

            await driver.pause(500)

            const lastNameField = await $('android=new UiSelector().text("Last name")')
            const lastNameDisplayed = await lastNameField.isDisplayed().catch(() => false)

            if (lastNameDisplayed) {
                await lastNameField.setValue(contact.lastName)
                console.log(`Entered Last name: ${contact.lastName}`)
            }

            await driver.pause(500)

            const phoneField = await $('android=new UiSelector().text("Phone")')
            const phoneDisplayed = await phoneField.isDisplayed().catch(() => false)

            if (phoneDisplayed) {
                await phoneField.setValue(contact.phone)
                console.log(`Entered Phone: ${contact.phone}`)
            }

            await driver.pause(500)

            const emailField = await $('android=new UiSelector().text("Email")')
            const emailDisplayed = await emailField.isDisplayed().catch(() => false)

            if (emailDisplayed) {
                await emailField.setValue(contact.email)
                console.log(`Entered Email: ${contact.email}`)
            }

            await driver.pause(1000)

            const saveBtn = await $('android=new UiSelector().description("Save")')
            const saveBtnText = await $('android=new UiSelector().text("Save")')

            let saveDisplayed = await saveBtn.isDisplayed().catch(() => false)
            let saveDisplayedText = await saveBtnText.isDisplayed().catch(() => false)

            console.log(`Save button displayed: ${saveDisplayed || saveDisplayedText}`)

            if (saveDisplayed) {
                await saveBtn.click()
            } else if (saveDisplayedText) {
                await saveBtnText.click()
            }

            await driver.pause(3000)

            const pageSource = await driver.getPageSource()
            const fullName = `${contact.firstName} ${contact.lastName}`
            const hasContact = pageSource.includes(fullName)
            console.log(`Contact "${fullName}" found: ${hasContact}`)

            try {
                const backBtn = await $('android=new UiSelector().description("Navigate up")')
                if (await backBtn.isDisplayed().catch(() => false)) {
                    await backBtn.click()
                    await driver.pause(1000)
                }
            } catch (e) {
                console.log('Navigate back not needed')
            }

            expect(hasContact).toBe(true)
        })
    })
})