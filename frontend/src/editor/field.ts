import type { MathfieldElement } from 'mathlive'

// The one math-field on the page. Kept out of the stores: it is a DOM element
// driven imperatively, not state to render from.
let field: MathfieldElement | null = null

export const editor = {
  attach(el: MathfieldElement | null) {
    field = el
  },
  read(): string {
    return field?.value ?? ''
  },
  write(latex: string) {
    if (field) field.value = latex
  },
  insert(latex: string) {
    field?.executeCommand(['insert', latex])
  },
  deleteBackward() {
    field?.executeCommand('deleteBackward')
  },
  focus() {
    field?.focus()
  },
}
