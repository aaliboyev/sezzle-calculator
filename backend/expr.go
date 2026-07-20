package main

import (
	"errors"
	"fmt"
	"math"
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

type tokenKind int

const (
	tokNumber tokenKind = iota
	tokOperator
	tokPercent
	tokLParen
	tokRParen
)

type token struct {
	kind tokenKind
	text string
	num  float64
}

func tokenize(expr string) ([]token, error) {
	var tokens []token
	i := 0
	for i < len(expr) {
		c := expr[i]
		switch {
		case c == ' ' || c == '\t':
			i++
		case c >= '0' && c <= '9' || c == '.':
			j := i
			for j < len(expr) && (expr[j] >= '0' && expr[j] <= '9' || expr[j] == '.') {
				j++
			}
			if j < len(expr) && (expr[j] == 'e' || expr[j] == 'E') {
				k := j + 1
				if k < len(expr) && (expr[k] == '+' || expr[k] == '-') {
					k++
				}
				if k < len(expr) && expr[k] >= '0' && expr[k] <= '9' {
					for k < len(expr) && expr[k] >= '0' && expr[k] <= '9' {
						k++
					}
					j = k
				}
			}
			text := expr[i:j]
			n, err := strconv.ParseFloat(text, 64)
			if err != nil {
				if errors.Is(err, strconv.ErrRange) {
					return nil, &calcError{"overflow", fmt.Sprintf("number %q exceeds the range of a 64-bit float", text)}
				}
				return nil, syntaxErr("invalid number %q", text)
			}
			tokens = append(tokens, token{kind: tokNumber, text: text, num: n})
			i = j
		case strings.ContainsRune("+-*/^", rune(c)):
			tokens = append(tokens, token{kind: tokOperator, text: string(c)})
			i++
		case c == '%':
			tokens = append(tokens, token{kind: tokPercent, text: "%"})
			i++
		case c == '(':
			tokens = append(tokens, token{kind: tokLParen, text: "("})
			i++
		case c == ')':
			tokens = append(tokens, token{kind: tokRParen, text: ")"})
			i++
		case c >= 'a' && c <= 'z':
			j := i
			for j < len(expr) && expr[j] >= 'a' && expr[j] <= 'z' {
				j++
			}
			word := expr[i:j]
			if word != "sqrt" {
				return nil, syntaxErr("unknown function %q", word)
			}
			tokens = append(tokens, token{kind: tokOperator, text: "sqrt"})
			i = j
		case strings.HasPrefix(expr[i:], "√"):
			tokens = append(tokens, token{kind: tokOperator, text: "sqrt"})
			i += len("√")
		default:
			r, _ := utf8.DecodeRuneInString(expr[i:])
			return nil, syntaxErr("invalid character %q", string(r))
		}
	}
	return tokens, nil
}

type operator struct {
	prec       int
	rightAssoc bool
	arity      int
}

var operators = map[string]operator{
	"+":    {1, false, 2},
	"-":    {1, false, 2},
	"*":    {2, false, 2},
	"/":    {2, false, 2},
	"neg":  {2, true, 1},
	"^":    {3, true, 2},
	"sqrt": {4, true, 1},
}

// valueEnd reports whether a token can end a value, i.e. a binary
// operator, ")" or "%" may directly follow it.
func valueEnd(t *token) bool {
	return t != nil && (t.kind == tokNumber || t.kind == tokRParen || t.kind == tokPercent)
}

func toRPN(tokens []token) ([]token, error) {
	if len(tokens) == 0 {
		return nil, syntaxErr("expression is empty")
	}
	var output, stack []token
	var prev *token
	for idx := range tokens {
		t := tokens[idx]
		switch t.kind {
		case tokNumber:
			if valueEnd(prev) {
				return nil, syntaxErr("unexpected number %q", t.text)
			}
			output = append(output, t)
		case tokOperator:
			if t.text == "-" && !valueEnd(prev) {
				t.text = "neg"
			}
			op := operators[t.text]
			if op.arity == 1 {
				// Prefix operators cannot follow a value and never pop the stack.
				if valueEnd(prev) {
					return nil, syntaxErr("unexpected %q", displayOp(t.text))
				}
				stack = append(stack, t)
				break
			}
			if !valueEnd(prev) {
				return nil, syntaxErr("unexpected operator %q", t.text)
			}
			for len(stack) > 0 {
				top := stack[len(stack)-1]
				if top.kind != tokOperator {
					break
				}
				topOp := operators[top.text]
				if topOp.prec > op.prec || (topOp.prec == op.prec && !op.rightAssoc) {
					output = append(output, top)
					stack = stack[:len(stack)-1]
				} else {
					break
				}
			}
			stack = append(stack, t)
		case tokPercent:
			if !valueEnd(prev) {
				return nil, syntaxErr("unexpected %q", "%")
			}
			output = append(output, t)
		case tokLParen:
			if valueEnd(prev) {
				return nil, syntaxErr("unexpected %q", "(")
			}
			stack = append(stack, t)
		case tokRParen:
			if !valueEnd(prev) {
				return nil, syntaxErr("unexpected %q", ")")
			}
			for {
				if len(stack) == 0 {
					return nil, syntaxErr("unmatched %q", ")")
				}
				top := stack[len(stack)-1]
				stack = stack[:len(stack)-1]
				if top.kind == tokLParen {
					break
				}
				output = append(output, top)
			}
		}
		prev = &t
	}
	if !valueEnd(prev) {
		return nil, syntaxErr("unexpected end of expression")
	}
	for len(stack) > 0 {
		top := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		if top.kind == tokLParen {
			return nil, syntaxErr("unmatched %q", "(")
		}
		output = append(output, top)
	}
	return output, nil
}

func displayOp(text string) string {
	if text == "sqrt" {
		return "√"
	}
	return text
}

func evalRPN(rpn []token) (float64, error) {
	var stack []float64
	pop := func() float64 {
		v := stack[len(stack)-1]
		stack = stack[:len(stack)-1]
		return v
	}
	for _, t := range rpn {
		var res float64
		switch t.kind {
		case tokNumber:
			stack = append(stack, t.num)
			continue
		case tokPercent:
			if len(stack) < 1 {
				return 0, syntaxErr("invalid expression")
			}
			res = pop() / 100
		case tokOperator:
			op := operators[t.text]
			if len(stack) < op.arity {
				return 0, syntaxErr("invalid expression")
			}
			if op.arity == 1 {
				v := pop()
				if t.text == "sqrt" {
					if v < 0 {
						return 0, &calcError{"undefined_result", "square root of a negative number is undefined"}
					}
					res = math.Sqrt(v)
				} else {
					res = -v
				}
			} else {
				b, a := pop(), pop()
				switch t.text {
				case "+":
					res = a + b
				case "-":
					res = a - b
				case "*":
					res = a * b
				case "/":
					if b == 0 {
						if a == 0 {
							return 0, &calcError{"undefined_result", "0/0 is undefined"}
						}
						return 0, &calcError{"division_by_zero", "division by zero"}
					}
					res = a / b
				case "^":
					if a == 0 && b < 0 {
						return 0, &calcError{"division_by_zero", "zero raised to a negative power"}
					}
					res = math.Pow(a, b)
				}
			}
		}
		if math.IsInf(res, 0) {
			return 0, &calcError{"overflow", "result exceeds the range of a 64-bit float"}
		}
		if math.IsNaN(res) {
			return 0, &calcError{"undefined_result", "result is undefined"}
		}
		stack = append(stack, res)
	}
	if len(stack) != 1 {
		return 0, syntaxErr("invalid expression")
	}
	return stack[0], nil
}

func Calculate(expr string) (float64, error) {
	tokens, err := tokenize(expr)
	if err != nil {
		return 0, err
	}
	rpn, err := toRPN(tokens)
	if err != nil {
		return 0, err
	}
	return evalRPN(rpn)
}
