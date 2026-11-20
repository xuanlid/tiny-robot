import { expect, test } from '@playwright/test'
import type { TrajectoryInstance } from '../../components/src/vanilla'

declare global {
  interface Window {
    trajectoryDemo: TrajectoryInstance
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto('/trace/index.html')
  await page.waitForFunction(() => typeof window.trajectoryDemo !== 'undefined')
})

test('renders requests, tools, and timeline records', async ({ page }) => {
  await expect(page.locator('.tr-trajectory__timeline-domain')).toBeVisible()
  await expect(page.locator('.tr-trajectory__inspector')).toBeHidden()
  await expect(page.locator('.tr-trajectory__record[data-kind="request"]')).toHaveCount(1)
  await expect(page.locator('.tr-trajectory__record[data-kind="tool"]')).toHaveCount(1)
  await expect(page.locator('.tr-trajectory__record[data-kind="assistant"]')).toHaveCount(1)
})

test('opens and closes the inspector from a ledger record', async ({ page }) => {
  await page.locator('.tr-trajectory__record[data-kind="assistant"]').click()
  await expect(page.locator('.tr-trajectory__inspector')).toBeVisible()
  await expect(page.locator('.tr-trajectory__content')).toHaveClass(/has-inspector/)
  await page.locator('.tr-trajectory__close').click()
  await expect(page.locator('.tr-trajectory__inspector')).toBeHidden()
  await expect(page.locator('.tr-trajectory__content')).not.toHaveClass(/has-inspector/)
})

test('opens tool payload and result in the inspector', async ({ page }) => {
  await page.locator('.tr-trajectory__record[data-kind="tool"]').click()
  await expect(page.locator('.tr-trajectory__inspector-title')).toContainText('TOOL')
  await page.getByRole('button', { name: 'Payload' }).click()
  await expect(page.locator('.tr-trajectory__pre')).toContainText('query')
  await page.getByRole('button', { name: 'Result' }).click()
  await expect(page.locator('.tr-trajectory__pre')).toContainText('Found 3 matching files.')
})

test('appends a running tool and settles it without recreating the instance', async ({ page }) => {
  await expect(page.locator('.tr-trajectory')).toHaveCount(1)
  await page.evaluate(() => {
    window.trajectoryDemo.append({
      sessionId: 'trajectory-test',
      seq: 7,
      type: 'tool.start',
      timestamp: 2_000,
      turn: 1,
      step: 2,
      callId: 'call-running',
      data: { name: 'read', argsRaw: '{"path":"README.md"}' },
    })
  })
  await expect(page.locator('.tr-trajectory__record[data-record-id="tool:call-running"]')).toContainText('Running')
  await page.evaluate(() => {
    window.trajectoryDemo.append({
      sessionId: 'trajectory-test',
      seq: 8,
      type: 'tool.result',
      timestamp: 2_240,
      turn: 1,
      step: 2,
      callId: 'call-running',
      data: { resultText: 'README loaded' },
    })
  })
  await expect(page.locator('.tr-trajectory__record[data-record-id="tool:call-running"]')).toContainText('Completed')
  await expect(page.locator('.tr-trajectory')).toHaveCount(1)
})

test('renders user messages and nested subtools as an indented event ledger', async ({ page }) => {
  await page.evaluate(() => {
    window.trajectoryDemo.append([
      {
        sessionId: 'trajectory-test',
        seq: 9,
        type: 'user.message',
        timestamp: 3_000,
        turn: 2,
        step: 0,
        data: { text: 'Inspect the nested operation.', source: 'human' },
      },
      {
        sessionId: 'trajectory-test',
        seq: 10,
        type: 'tool.start',
        timestamp: 3_100,
        turn: 2,
        step: 1,
        callId: 'call-parent',
        data: { name: 'run_code', argsRaw: '{"code":"inspect()"}' },
      },
      {
        sessionId: 'trajectory-test',
        seq: 11,
        type: 'tool.start',
        timestamp: 3_140,
        turn: 2,
        step: 1,
        callId: 'call-child',
        parentCallId: 'call-parent',
        data: { name: 'read_file', argsRaw: '{"path":"README.md"}' },
      },
    ])
  })
  await expect(page.locator('.tr-trajectory__record[data-kind="user"]')).toHaveCount(1)
  await expect(page.locator('.tr-trajectory__record[data-kind="subtool"]')).toHaveCount(1)
})

test('projects business messages, requests, and tool data into trace records', async ({ page }) => {
  await page.evaluate(() => {
    window.trajectoryDemo.replace({
      sessionId: 'business-session',
      messages: [
        {
          seq: 1,
          timestamp: 1_000,
          role: 'user',
          turn: 1,
          step: 0,
          content: [{ type: 'text', text: 'Read the project files.' }],
        },
        {
          seq: 3,
          timestamp: 1_200,
          role: 'assistant',
          turn: 1,
          step: 1,
          content: [
            { type: 'text', text: 'I will inspect the project.' },
            { type: 'tool-call', callId: 'business-call', name: 'read_file', argsRaw: '{"path":"README.md"}' },
          ],
        },
      ],
      requests: [
        {
          requestId: 'business-request',
          seq: 2,
          timestamp: 1_100,
          turn: 1,
          step: 1,
          provider: 'deepseek',
          model: 'deepseek-reasoner',
          status: 'complete',
          completedAt: 1_600,
        },
      ],
      toolResults: [
        {
          callId: 'business-call',
          seq: 4,
          timestamp: 1_500,
          resultText: 'README loaded',
        },
      ],
    })
  })
  await expect(page.locator('.tr-trajectory__record[data-kind="user"]')).toHaveCount(1)
  await expect(page.locator('.tr-trajectory__record[data-kind="assistant"]')).toHaveCount(1)
  await expect(page.locator('.tr-trajectory__record[data-kind="tool"]')).toHaveCount(1)
  await page.evaluate(() => {
    window.trajectoryDemo.append({
      sessionId: 'business-session',
      messages: [
        {
          seq: 5,
          timestamp: 1_700,
          role: 'user',
          turn: 2,
          step: 0,
          content: [{ type: 'text', text: 'Continue the inspection.' }],
        },
      ],
    })
  })
  await expect(page.locator('.tr-trajectory__record[data-kind="user"]')).toHaveCount(2)
})
