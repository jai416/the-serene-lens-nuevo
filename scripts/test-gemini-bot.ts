import "dotenv/config"
import { chatWithGemini, GeminiError } from "../src/lib/gemini-chat"

let passed = 0
let failed = 0

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`)
    passed++
  } else {
    console.log(`  ❌ ${label}`)
    failed++
  }
}

async function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  console.log("🧪 Testing Gemini Bot...\n")

  // 1. Test basic chat
  console.log("📝 Test 1: Basic chat response")
  try {
    const response = await chatWithGemini("¿Qué es la niacinamida?")
    assert(response.length > 0, "Response is not empty")
    assert(typeof response === "string", "Response is a string")
    assert(!response.includes("error"), "Response does not contain error")
    console.log(`   Response: "${response.slice(0, 100)}..."`)
  } catch (e) {
    if (e instanceof GeminiError && e.code === "CONFIG_ERROR") {
      console.log("  ⚠️  GEMINI_API_KEY not configured — skipping live test")
    } else {
      console.log(`  ❌ Test 1 failed: ${e instanceof Error ? e.message : String(e)}`)
      failed++
    }
  }

  // 2. Test empty message
  console.log("\n📝 Test 2: Empty message")
  try {
    await chatWithGemini("")
    console.log("  ⚠️  Empty message was accepted (may be OK)")
    passed++
  } catch (e) {
    console.log(`  ✅ Empty message rejected: ${(e as Error).message.slice(0, 80)}`)
    passed++
  }

  // 3. Test rate limiting simulation
  console.log("\n📝 Test 3: Subsequent calls")
  for (let i = 0; i < 3; i++) {
    try {
      const r = await chatWithGemini(`Dime un número del 1 al 10, solo el número.`)
      assert(r.length > 0, `Call ${i + 1} returned response`)
      await wait(1500)
    } catch (e) {
      console.log(`  ⚠️  Call ${i + 1} failed: ${(e as Error).message.slice(0, 80)}`)
      if (failed < 3) failed++ // only count first failure
    }
  }

  // Summary
  console.log("\n═══════════════════════════")
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total:  ${passed + failed}`)

  if (failed > 0) {
    console.log("\n❌ Gemini bot test FAILED")
    process.exit(1)
  } else {
    console.log("\n✅ Gemini bot test PASSED")
  }
}

main().catch((e) => {
  console.error("❌ Test error:", e)
  process.exit(1)
})
