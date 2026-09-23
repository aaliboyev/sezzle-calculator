package main

import (
	"encoding/json"
	"errors"
	"math"
	"os"
	"reflect"
	"testing"
)

// The fixture maps LaTeX to the trees the client's guide templates were
// written against, recorded from the math-field's own parser.
const treeFixture = "../frontend/src/engine/latex-trees.json"

func TestParseMatchesFixtureTrees(t *testing.T) {
	data, err := os.ReadFile(treeFixture)
	if err != nil {
		t.Fatal(err)
	}
	var fixture map[string]any
	if err := json.Unmarshal(data, &fixture); err != nil {
		t.Fatal(err)
	}
	if len(fixture) < 100 {
		t.Fatalf("fixture has only %d entries", len(fixture))
	}
	for latex, want := range fixture {
		tree, err := parseLatex(latex)
		if err != nil {
			t.Errorf("%s: %v", latex, err)
			continue
		}
		encoded, _ := json.Marshal(tree)
		var got any
		json.Unmarshal(encoded, &got)
		if !reflect.DeepEqual(got, want) {
			wantJSON, _ := json.Marshal(want)
			t.Errorf("%s:\n got %s\nwant %s", latex, encoded, wantJSON)
		}
	}
}

func calc(latex string) (float64, error) {
	tree, err := parseLatex(latex)
	if err != nil {
		return 0, err
	}
	return evaluate(tree)
}

func TestEvaluate(t *testing.T) {
	tests := []struct {
		latex string
		want  float64
	}{
		{"1+2", 3},
		{"2+3*4", 14},
		{"(2+3)\\cdot4", 20},
		{"\\left(2+3\\right)\\times4", 20},
		{"10/4", 2.5},
		{"\\frac{10}{4}", 2.5},
		{"7-10", -3},
		{"5-2-1", 2},
		{"2^{10}", 1024},
		{"2^{3^2}", 512},
		{"-2^2", -4},
		{"2^{-1}", 0.5},
		{"2\\cdot-3", -6},
		{"--2", 2},
		{"-(3+4)", -7},
		{"0.1+0.2", 0.30000000000000004},
		{"1e10*2", 2e10},
		{" 1 + 1 ", 2},
		{"1\\,+\\,1", 2},
		{"\\sqrt[4]{16}", 2},
		{"\\sqrt[2]{2}", math.Sqrt2},
		{"50\\%", 0.5},
		{"200\\cdot10\\%", 20},
		{"-5\\%", -0.05},
		{"\\sqrt{9}", 3},
		{"\\sqrt9", 3},
		{"\\sqrt{2}", math.Sqrt2},
		{"\\sqrt{\\sqrt{16}}", 2},
		{"\\sqrt{4}^2", 4},
		{"2\\sqrt{9}", 6},
		{"2(3+1)", 8},
		{"\\sqrt[3]{27}", 3},
		{"\\sqrt[3]{-8}", -2},
		{"\\frac12", 0.5},
		{"{2+3}\\cdot4", 20},
		{".5\\cdot2", 1},
		{"\\frac{0}{5}", 0},
	}
	for _, tt := range tests {
		got, err := calc(tt.latex)
		if err != nil {
			t.Errorf("%s: error %v", tt.latex, err)
			continue
		}
		if got != tt.want {
			t.Errorf("%s = %v, want %v", tt.latex, got, tt.want)
		}
	}
}

func TestEvaluateErrors(t *testing.T) {
	tests := []struct {
		latex, code, message string
	}{
		{"\\frac{1}{0}", "division_by_zero", "division by zero"},
		{"\\frac{0}{0}", "undefined_result", "0/0 is undefined"},
		{"0^{-1}", "division_by_zero", ""},
		{"\\sqrt{-1}", "undefined_result", "square root of a negative number is undefined"},
		{"\\sqrt[4]{-16}", "undefined_result", ""},
		{"\\sqrt[0]{2}", "undefined_result", ""},
		{"(-8)^{0.5}", "undefined_result", ""},
		{"1e308\\cdot10", "overflow", ""},
		{"1e999", "overflow", ""},
		{"2^{9999}", "overflow", ""},
		{"", "invalid_expression", "expression is empty"},
		{"\\,", "invalid_expression", "expression is empty"},
		{"2+", "invalid_expression", "expression is incomplete"},
		{"\\sqrt{}", "invalid_expression", ""},
		{"\\frac{1}", "invalid_expression", ""},
		{"*2", "invalid_expression", `unexpected "*"`},
		{"2 3", "invalid_expression", "unexpected number after a value"},
		{"(2+3", "invalid_expression", `unmatched "("`},
		{"2+3)", "invalid_expression", `unmatched ")"`},
		{"\\left(2", "invalid_expression", `unmatched "("`},
		{"()", "invalid_expression", "empty parentheses"},
		{"2..3", "invalid_expression", ""},
		{".", "invalid_expression", ""},
		{"(1+2)\\%", "invalid_expression", "percent must follow a number"},
		{"2^3^2", "invalid_expression", "nested exponents need braces, like 2^{3^2}"},
		{"2$3", "invalid_expression", `unexpected "$"`},
		{"x+1", "unsupported", "unsupported: x"},
		{"\\pi", "unsupported", "unsupported: π"},
		{"\\infty", "unsupported", "unsupported: ∞"},
		{"\\sin(3)", "unsupported", "unsupported: sin"},
		{"2=4", "unsupported", "unsupported: ="},
		{"x_1", "unsupported", "unsupported: x"},
		{"2\\cdots", "unsupported", "unsupported: …"},
	}
	for _, tt := range tests {
		_, err := calc(tt.latex)
		var ce *calcError
		if !errors.As(err, &ce) {
			t.Errorf("%q: want %s, got %v", tt.latex, tt.code, err)
			continue
		}
		if ce.code != tt.code || (tt.message != "" && ce.message != tt.message) {
			t.Errorf("%q: got %s %q, want %s %q", tt.latex, ce.code, ce.message, tt.code, tt.message)
		}
	}
}

// Nesting is bounded by the request's rune limit; this is the deep end of it.
func TestParseDeepNesting(t *testing.T) {
	latex := ""
	for range 400 {
		latex += "\\sqrt{"
	}
	latex += "1"
	for range 400 {
		latex += "}"
	}
	if got, err := calc(latex); err != nil || got != 1 {
		t.Fatalf("got %v, %v", got, err)
	}
}
