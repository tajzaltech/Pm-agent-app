import { spawn } from "node:child_process"
import { mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const port = Number(process.env.PM_AGENT_CDP_PORT ?? 9223)
const origin = process.env.PM_AGENT_ORIGIN ?? "http://127.0.0.1:3100"
const chromePath =
  process.env.PM_AGENT_CHROME_PATH ??
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"

const profilePath = await mkdtemp(join(tmpdir(), "pm-agent-cdp-"))
const chrome = spawn(
  chromePath,
  [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profilePath}`,
    "about:blank",
  ],
  { stdio: "ignore", windowsHide: true },
)
process.on("exit", () => chrome.kill())

const delay = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds))

async function getPage() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`)
      const targets = await response.json()
      const page = targets.find((target) => target.type === "page")
      if (page) return page
    } catch {
      // Chrome may still be starting.
    }
    await delay(100)
  }
  throw new Error("Could not connect to the Chrome DevTools endpoint")
}

const page = await getPage()
const socket = new WebSocket(page.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true })
  socket.addEventListener("error", reject, { once: true })
})

let commandId = 0
const pending = new Map()

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data)
  if (!message.id) return
  const request = pending.get(message.id)
  if (!request) return
  pending.delete(message.id)
  if (message.error) request.reject(new Error(message.error.message))
  else request.resolve(message.result)
})

function command(method, params = {}) {
  commandId += 1
  const id = commandId
  socket.send(JSON.stringify({ id, method, params }))
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }))
}

async function evaluate(expression) {
  const result = await command("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? "Browser evaluation failed")
  }
  return result.result.value
}

async function navigate(path) {
  await command("Page.navigate", { url: `${origin}${path}` })
}

async function snapshot() {
  return evaluate(`({
    href: location.href,
    text: document.body?.innerText ?? "",
    auth: localStorage.getItem("pm-agent-auth"),
    setup: localStorage.getItem("pm-agent-setup")
  })`)
}

async function waitFor(description, predicate, timeout = 6000) {
  const startedAt = Date.now()
  let state
  while (Date.now() - startedAt < timeout) {
    try {
      state = await snapshot()
      if (predicate(state)) return state
    } catch {
      // A navigation can briefly destroy the current JavaScript context.
    }
    await delay(100)
  }
  throw new Error(`${description} timed out. Last URL: ${state?.href ?? "unknown"}`)
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

await command("Page.enable")
await command("Runtime.enable")
await command("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 1000,
  deviceScaleFactor: 1,
  mobile: false,
})

const results = []
const record = (name, state) => {
  results.push({ name, url: state.href.replace(origin, "") })
}

await navigate("/signin")
await waitFor("Sign-in page", (state) => state.text.includes("Sign in to PM Agent"))
await evaluate("localStorage.clear()")

await navigate("/")
let state = await waitFor("Fresh root redirect", (current) =>
  current.href.endsWith("/signin") && current.text.includes("Sign in to PM Agent"),
)
record("fresh root opens Sign In", state)

await navigate("/chat")
state = await waitFor("Protected route redirect", (current) =>
  current.href.endsWith("/signin"),
)
record("protected route requires authentication", state)

await evaluate(`(() => {
  document.querySelector("#email").value = "qa@pmagent.app"
  document.querySelector("#password").value = "test-password"
  document.querySelector("form").requestSubmit()
})()`)
state = await waitFor("Sign-in redirect", (current) =>
  current.href.includes("/chat") && current.text.includes("Ask PM"),
)
record("sign in opens Ask PM", state)

if (process.env.PM_AGENT_SCREENSHOT_PATH) {
  const image = await command("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  })
  await writeFile(process.env.PM_AGENT_SCREENSHOT_PATH, image.data, "base64")
}

await navigate("/")
state = await waitFor("Returning root redirect", (current) =>
  current.href.includes("/chat"),
)
record("returning root opens Ask PM", state)

await navigate("/triage?search=refund&classification=bug")
state = await waitFor("Legacy route redirect", (current) =>
  current.href.includes("/pipeline") &&
  current.href.includes("search=refund") &&
  current.href.includes("classification=bug"),
)
record("legacy route preserves filters", state)

await evaluate(
  `document.querySelector('[aria-label="Open profile menu"]').click()`,
)
await waitFor("Profile menu", (current) => current.text.includes("Sign out"))
await evaluate(`(() => {
  const signOut = [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.includes("Sign out"))
  signOut?.click()
})()`)
state = await waitFor("Sign-out redirect", (current) =>
  current.href.endsWith("/signin"),
)
const authState = JSON.parse(state.auth).state
const setupState = JSON.parse(state.setup).state
assert(authState.isAuthenticated === false, "Sign out did not clear authentication")
assert(setupState.isSetup === true, "Sign out incorrectly cleared workspace setup")
record("sign out preserves workspace setup", state)

await evaluate("localStorage.clear()")
await navigate("/signup")
await waitFor("Sign-up page", (current) =>
  current.text.includes("Start your PM Agent account"),
)
await evaluate(`(() => {
  const githubButton = [...document.querySelectorAll("button")]
    .find((button) => button.textContent?.includes("GitHub"))
  githubButton?.click()
})()`)
state = await waitFor("New account onboarding", (current) =>
  current.href.includes("/onboarding"),
)
record("new account starts onboarding", state)

socket.close()
chrome.kill()
console.log(JSON.stringify({ passed: results.length, results }, null, 2))
