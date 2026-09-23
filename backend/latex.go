package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"unicode/utf8"
)

type calcError struct {
	code    string
	message string
}

func (e *calcError) Error() string { return e.message }

func syntaxErr(format string, args ...any) *calcError {
	return &calcError{"invalid_expression", fmt.Sprintf(format, args...)}
}

func unsupported(what string) *calcError {
	return &calcError{"unsupported", "unsupported: " + what}
}

// node is a parsed expression in MathJSON form: a number, or an operator
// head with arguments. The client matches guide templates against this shape.
type node struct {
	op   string
	num  float64
	args []*node
}

func (n *node) MarshalJSON() ([]byte, error) {
	if n.op == "" {
		return json.Marshal(n.num)
	}
	parts := make([]any, 0, len(n.args)+1)
	parts = append(parts, n.op)
	for _, a := range n.args {
		parts = append(parts, a)
	}
	return json.Marshal(parts)
}

func apply(op string, args ...*node) *node { return &node{op: op, args: args} }

// Commands that only adjust spacing.
var spacing = map[string]bool{",": true, ";": true, ":": true, "!": true, " ": true, "quad": true, "qquad": true}

var symbolNames = map[string]string{"pi": "π", "infty": "∞", "cdots": "…", "ldots": "…"}

type parser struct {
	src string
	pos int
}

// parseLatex reads the LaTeX subset a math-field produces for arithmetic.
// Binding, loosest first: + (flattened), - , \cdot \times * (flattened),
// / \div, implicit products, unary minus, ^. This mirrors how the client's
// guide templates expect expressions to be grouped.
func parseLatex(latex string) (*node, error) {
	p := &parser{src: latex}
	p.skipSpace()
	if p.done() {
		return nil, syntaxErr("expression is empty")
	}
	n, err := p.parseSum()
	if err != nil {
		return nil, err
	}
	p.skipSpace()
	if !p.done() {
		return nil, p.unexpected()
	}
	return n, nil
}

func (p *parser) done() bool { return p.pos >= len(p.src) }

// command returns the name after a backslash at the cursor, without consuming it.
func (p *parser) command() (string, int) {
	if p.done() || p.src[p.pos] != '\\' {
		return "", 0
	}
	i := p.pos + 1
	for i < len(p.src) && isLetter(p.src[i]) {
		i++
	}
	if i == p.pos+1 && i < len(p.src) {
		_, size := utf8.DecodeRuneInString(p.src[i:])
		i += size
	}
	return p.src[p.pos+1 : i], i - p.pos
}

func isLetter(c byte) bool { return c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' }
func isDigit(c byte) bool  { return c >= '0' && c <= '9' }

func (p *parser) skipSpace() {
	for !p.done() {
		if c := p.src[p.pos]; c == ' ' || c == '\t' || c == '\n' || c == '\r' {
			p.pos++
			continue
		}
		name, size := p.command()
		if !spacing[name] {
			return
		}
		p.pos += size
	}
}

// accept consumes the next token if it is one of the given symbols or
// commands (written with their backslash).
func (p *parser) accept(tokens ...string) string {
	p.skipSpace()
	for _, t := range tokens {
		if strings.HasPrefix(p.src[p.pos:], t) {
			// A command must not continue with letters: \times, not \timesx.
			end := p.pos + len(t)
			if t[0] == '\\' && isLetter(t[len(t)-1]) && end < len(p.src) && isLetter(p.src[end]) {
				continue
			}
			p.pos = end
			return t
		}
	}
	return ""
}

func (p *parser) expect(token, context string) error {
	if p.accept(token) == "" {
		if p.done() {
			return syntaxErr("expression is incomplete: missing %q", context)
		}
		return syntaxErr("missing %q", context)
	}
	return nil
}

func (p *parser) unexpected() error {
	p.skipSpace()
	if p.done() {
		return syntaxErr("expression is incomplete")
	}
	if name, _ := p.command(); name != "" {
		switch name {
		case "right":
			return syntaxErr("unmatched %q", ")")
		case "%":
			return syntaxErr("percent must follow a number")
		}
		if display, ok := symbolNames[name]; ok {
			return unsupported(display)
		}
		return unsupported(name)
	}
	r, _ := utf8.DecodeRuneInString(p.src[p.pos:])
	switch {
	case r == ')' || r == '}' || r == ']':
		return syntaxErr("unmatched %q", string(r))
	case r < utf8.RuneSelf && isLetter(byte(r)), r == '=', r == '<', r == '>', r == '!', r == '_':
		return unsupported(string(r))
	case r < utf8.RuneSelf && isDigit(byte(r)):
		return syntaxErr("unexpected number after a value")
	case r == '%':
		return syntaxErr("percent must follow a number")
	case r == '^':
		return syntaxErr("nested exponents need braces, like 2^{3^2}")
	}
	return syntaxErr("unexpected %q", string(r))
}

func (p *parser) parseSum() (*node, error) {
	left, err := p.parseDifference()
	if err != nil {
		return nil, err
	}
	var sum *node
	for p.accept("+") != "" {
		right, err := p.parseDifference()
		if err != nil {
			return nil, err
		}
		if sum == nil {
			sum = apply("Add", left, right)
			left = sum
		} else {
			sum.args = append(sum.args, right)
		}
	}
	return left, nil
}

func (p *parser) parseDifference() (*node, error) {
	left, err := p.parseProduct()
	if err != nil {
		return nil, err
	}
	for p.accept("-") != "" {
		right, err := p.parseProduct()
		if err != nil {
			return nil, err
		}
		left = apply("Subtract", left, right)
	}
	return left, nil
}

func (p *parser) parseProduct() (*node, error) {
	left, err := p.parseQuotient()
	if err != nil {
		return nil, err
	}
	var product *node
	for p.accept(`\cdot`, `\times`, "*") != "" {
		right, err := p.parseQuotient()
		if err != nil {
			return nil, err
		}
		if product == nil {
			product = apply("Multiply", left, right)
			left = product
		} else {
			product.args = append(product.args, right)
		}
	}
	return left, nil
}

func (p *parser) parseQuotient() (*node, error) {
	left, err := p.parseImplicit()
	if err != nil {
		return nil, err
	}
	for p.accept("/", `\div`) != "" {
		right, err := p.parseImplicit()
		if err != nil {
			return nil, err
		}
		left = apply("Divide", left, right)
	}
	return left, nil
}

// Juxtaposition multiplies: 2(3+1), 2\sqrt{4}, (1)(2). Two bare numbers
// never do, and a following "-" is subtraction, not a factor.
func (p *parser) startsFactor() bool {
	p.skipSpace()
	if p.done() {
		return false
	}
	if c := p.src[p.pos]; c == '(' || c == '{' {
		return true
	}
	switch name, _ := p.command(); name {
	case "left", "sqrt", "frac", "dfrac", "tfrac":
		return true
	}
	return false
}

func (p *parser) parseImplicit() (*node, error) {
	left, err := p.parseFactor()
	if err != nil {
		return nil, err
	}
	var product *node
	for p.startsFactor() {
		right, err := p.parsePower()
		if err != nil {
			return nil, err
		}
		if product == nil {
			product = apply("Multiply", left, right)
			left = product
		} else {
			product.args = append(product.args, right)
		}
	}
	return left, nil
}

func (p *parser) parseFactor() (*node, error) {
	if p.accept("-") != "" {
		operand, err := p.parseFactor()
		if err != nil {
			return nil, err
		}
		return apply("Negate", operand), nil
	}
	if p.accept("+") != "" {
		return p.parseFactor()
	}
	return p.parsePower()
}

func (p *parser) parsePower() (*node, error) {
	base, err := p.parsePrimary()
	if err != nil {
		return nil, err
	}
	if p.accept("^") == "" {
		return base, nil
	}
	exponent, err := p.parseArgument("^")
	if err != nil {
		return nil, err
	}
	return apply("Power", base, exponent), nil
}

// parseArgument reads a command or superscript argument: a braced group, or
// a single digit or command as in \frac12 and \sqrt9.
func (p *parser) parseArgument(owner string) (*node, error) {
	p.skipSpace()
	if p.accept("{") != "" {
		if p.accept("}") != "" {
			return nil, syntaxErr("%s is missing its argument", owner)
		}
		n, err := p.parseSum()
		if err != nil {
			return nil, err
		}
		return n, p.expect("}", "}")
	}
	if !p.done() && isDigit(p.src[p.pos]) {
		p.pos++
		return &node{num: float64(p.src[p.pos-1] - '0')}, nil
	}
	if name, _ := p.command(); name != "" && !spacing[name] {
		return p.parsePrimary()
	}
	if p.done() {
		return nil, syntaxErr("expression is incomplete: %s is missing its argument", owner)
	}
	return nil, syntaxErr("%s is missing its argument", owner)
}

func (p *parser) parsePrimary() (*node, error) {
	p.skipSpace()
	if p.done() {
		return nil, syntaxErr("expression is incomplete")
	}
	c := p.src[p.pos]
	switch {
	case isDigit(c) || c == '.':
		return p.parseNumber()
	case c == '(':
		p.pos++
		return p.parseGroup(")", ")")
	case c == '{':
		p.pos++
		return p.parseGroup("}", "}")
	}
	name, size := p.command()
	switch name {
	case "left":
		p.pos += size
		if err := p.expect("(", "("); err != nil {
			return nil, err
		}
		return p.parseGroup(`\right)`, ")")
	case "frac", "dfrac", "tfrac":
		p.pos += size
		numerator, err := p.parseArgument(`\frac`)
		if err != nil {
			return nil, err
		}
		denominator, err := p.parseArgument(`\frac`)
		if err != nil {
			return nil, err
		}
		return apply("Divide", numerator, denominator), nil
	case "sqrt":
		p.pos += size
		var index *node
		if p.accept("[") != "" {
			var err error
			if index, err = p.parseSum(); err != nil {
				return nil, err
			}
			if err := p.expect("]", "]"); err != nil {
				return nil, err
			}
		}
		radicand, err := p.parseArgument("√")
		if err != nil {
			return nil, err
		}
		if index != nil {
			return apply("Root", radicand, index), nil
		}
		return apply("Sqrt", radicand), nil
	}
	return nil, p.unexpected()
}

func (p *parser) parseGroup(closing, display string) (*node, error) {
	if p.accept(closing) != "" {
		return nil, syntaxErr("empty parentheses")
	}
	n, err := p.parseSum()
	if err != nil {
		return nil, err
	}
	if p.accept(closing) == "" {
		if p.done() {
			return nil, syntaxErr("unmatched %q", "(")
		}
		return nil, p.unexpected()
	}
	return n, nil
}

// scientificExponent consumes "\times10^{-9}" after a literal and returns
// "-9", so 7\times10^{-9} is one number, as the display writes it.
func (p *parser) scientificExponent() (string, bool) {
	start := p.pos
	if p.accept(`\times`, `\cdot`) != "" && p.accept("10") != "" && p.accept("^") != "" {
		if !p.done() && isDigit(p.src[p.pos]) {
			p.pos++
			if p.done() || !isDigit(p.src[p.pos]) {
				return p.src[p.pos-1 : p.pos], true
			}
		} else if p.accept("{") != "" {
			digits := p.pos
			if !p.done() && (p.src[p.pos] == '-' || p.src[p.pos] == '+') {
				p.pos++
			}
			for !p.done() && isDigit(p.src[p.pos]) {
				p.pos++
			}
			exponent := p.src[digits:p.pos]
			if strings.Trim(exponent, "+-") != "" && p.accept("}") != "" {
				return exponent, true
			}
		}
	}
	p.pos = start
	return "", false
}

// A percent sign folds into its literal: 18\% is the number 0.18, parsed
// from the digits so it rounds once, like any other literal.
func (p *parser) parseNumber() (*node, error) {
	start := p.pos
	for !p.done() && isDigit(p.src[p.pos]) {
		p.pos++
	}
	if !p.done() && p.src[p.pos] == '.' {
		p.pos++
		for !p.done() && isDigit(p.src[p.pos]) {
			p.pos++
		}
	}
	if !p.done() && (p.src[p.pos] == 'e' || p.src[p.pos] == 'E') {
		k := p.pos + 1
		if k < len(p.src) && (p.src[k] == '+' || p.src[k] == '-') {
			k++
		}
		if k < len(p.src) && isDigit(p.src[k]) {
			for k < len(p.src) && isDigit(p.src[k]) {
				k++
			}
			p.pos = k
		}
	}
	text := p.src[start:p.pos]
	if text == "." {
		return nil, syntaxErr("invalid number %q", text)
	}
	if exponent, ok := p.scientificExponent(); ok {
		text += "e" + exponent
	} else if p.accept(`\%`, "%") != "" {
		text += "e-2"
	}
	n, err := strconv.ParseFloat(text, 64)
	if errors.Is(err, strconv.ErrRange) {
		return nil, &calcError{"overflow", fmt.Sprintf("number %q exceeds the range of a 64-bit float", p.src[start:p.pos])}
	}
	if err != nil {
		return nil, syntaxErr("invalid number %q", text)
	}
	return &node{num: n}, nil
}
