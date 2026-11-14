const assert = require('node:assert/strict')
const path = require('node:path')
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')

const stations = [
  { id: 1, name: '科考站', name_en: 'Research Station' },
  { id: 2, name: '菌蓬', name_en: 'Junpeng' },
]
const routeResult = {
  result: '0',
  totalStops: 1,
  totalTime: 60,
  stationIds: [1, 2],
  segments: [{ lineName: '测试线路', name_en: 'Test Line', color: '#461d84', stationIds: [1, 2] }],
}

;(async () => {
  const { createServer } = await import('vite')
  const server = await createServer({
    configFile: path.resolve(__dirname, '../vite.config.js'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: true, hmr: false },
  })
  let browser
  try {
    await server.listen()
    const origin = `http://127.0.0.1:${server.httpServer.address().port}`
    browser = await chromium.launch({
      channel: process.env.PLAYWRIGHT_CHANNEL || (process.platform === 'darwin' ? 'chrome' : 'chromium'),
      headless: true,
    })
    const page = await browser.newPage()
    page.setDefaultTimeout(10000)
    const errors = []
    const i18nWarnings = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', msg => {
      if (msg.type() === 'warning' && msg.text().includes('[intlify]') && msg.text().includes('Not found')) {
        i18nWarnings.push(msg.text())
      }
    })
    await page.route('**/*', route => {
      const url = new URL(route.request().url())
      if (url.origin === origin) return route.continue()
      if (url.origin !== 'https://api.qoriginal.vip') return route.abort()
      if (url.pathname === '/qo/transportation/station/all') return route.fulfill({ json: stations })
      if (url.pathname === '/qo/transportation/calculate') return route.fulfill({ json: routeResult })
      return route.fulfill({ json: {} })
    })

    await page.goto(`${origin}/transport`)
    await page.locator('.transport-map-button').click()
    try {
      await page.locator('.line-layer .route-edge').first().waitFor({ state: 'attached', timeout: 5000 })
    } catch (error) {
      assert.deepEqual(errors, [], 'Opening the transport map should not throw')
      throw error
    }

    const edges = page.locator('.line-layer .route-edge')
    const initialEdgeCount = await edges.count()
    assert.ok(initialEdgeCount > 0, 'The map should render its routes')
    assert.ok(await page.locator('.map-station').count() > 0, 'The map should render its stations')
    const initialViewBox = await page.locator('.map-stage').getAttribute('viewBox')

    await page.locator('.zoom-controls button').nth(1).click()
    await page.waitForFunction(initial => document.querySelector('.map-stage').getAttribute('viewBox') !== initial, initialViewBox)
    assert.ok(await edges.count() > 0, 'Routes should remain visible after zooming')
    await page.locator('.reset-button').click()
    await page.waitForFunction(initial => document.querySelector('.map-stage').getAttribute('viewBox') === initial, initialViewBox)
    assert.equal(await edges.count(), initialEdgeCount, 'Reset should restore the initial routes')

    await page.locator('.map-close-button').click()
    await page.locator('.map-preview-overlay').waitFor({ state: 'hidden' })
    await page.locator('#start').fill('科考站')
    await page.locator('.start-input-container .suggestion-item').first().click()
    await page.locator('#end').fill('菌蓬')
    await page.locator('.end-input-container .suggestion-item').first().click()
    await page.locator('.search-button').click()
    await page.locator('.route-result-content').waitFor()
    await page.waitForFunction(() => {
      const seg = document.querySelector('.route-segment')
      const step = document.querySelector('.route-station-step')
      const bar = seg ? getComputedStyle(seg, '::before') : null
      return seg
        && step
        && getComputedStyle(seg).opacity === '1'
        && getComputedStyle(step).opacity === '1'
        && bar?.transform !== 'matrix(1, 0, 0, 0, 0, 0)'
    })
    assert.ok((await page.locator('.line_name').textContent()).includes('测试线路'), 'Route line name should be rendered')

    await page.locator('.options-button').click()
    await page.locator('.options-popup').waitFor()
    const zhOptionsText = await page.locator('.options-popup').innerText()
    assert.ok(zhOptionsText.includes('地铁') && zhOptionsText.includes('主世界'), 'Options modal should use translated zh transport and dimension labels')
    assert.ok(!zhOptionsText.includes('transportPage.'), 'Options modal should not leak raw transportPage i18n keys')
    await page.locator('.preset-button').nth(1).click()
    const zhDisabledText = await page.locator('.current-settings').innerText()
    assert.ok(zhDisabledText.includes('蓝冰船') && !zhDisabledText.includes('transportPage.'), 'Disabled summary should translate transport type names')
    await page.locator('.apply-button').click()
    await page.locator('.options-popup').waitFor({ state: 'hidden' })

    await page.locator('.transport-map-button').click()
    await page.locator('.line-layer .route-edge:not(.is-dimmed)').first().waitFor({ state: 'attached' })
    assert.ok(await page.locator('.line-layer .route-edge.is-dimmed').count() > 0, 'Unselected routes should be dimmed')
    await page.locator('.map-close-button').click()

    await page.evaluate(() => localStorage.setItem('locale', 'en'))
    await page.reload()
    await page.locator('.options-button').click()
    await page.locator('.options-popup').waitFor()
    const enOptionsText = await page.locator('.options-popup').innerText()
    assert.ok(enOptionsText.includes('Metro') && enOptionsText.includes('Overworld'), 'Options modal should translate en labels')
    assert.ok(!enOptionsText.includes('transportPage.'), 'English options modal should not leak raw transportPage i18n keys')

    assert.deepEqual(errors, [], 'Map and route interactions should not throw')
    assert.deepEqual(i18nWarnings, [], 'Transport view should not emit missing i18n key warnings')
    console.log('PASS: transport route details, options i18n, map rendering, zoom, reset and route highlighting')
  } finally {
    if (browser) await browser.close()
    await server.close()
  }
})().catch(error => {
  console.error(error)
  process.exitCode = 1
})
