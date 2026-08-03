/**
 * Copy text to the clipboard on every phone we sell to.
 *
 * `navigator.clipboard` is absent or permission-denied inside iOS in-app
 * webviews (Instagram, WhatsApp) and rejects without throwing anywhere the
 * caller can see it, which is why the UPI ID looked copied on iPhone and pasted
 * as nothing. `execCommand` still works there, but only over a real DOM
 * Selection: on iOS `textarea.select()` alone is ignored, so the range dance
 * below is load-bearing, as is `contentEditable` on a readOnly field.
 *
 * Returns false when nothing reached the clipboard — never claim "Copied".
 */
export async function copyText(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        // fall through to the legacy path
    }

    const el = document.createElement("textarea")
    el.value = text
    el.readOnly = true
    el.contentEditable = "true"
    el.style.cssText = "position:fixed;top:0;left:0;opacity:0"
    document.body.appendChild(el)

    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
    el.setSelectionRange(0, text.length)

    const ok = document.execCommand("copy")
    sel?.removeAllRanges()
    el.remove()
    return ok
}
