package main

import (
	"errors"
	"math"
	"testing"
)

func TestCalculate(t *testing.T) {
	tests := []struct {
		expr string
		want float64
	}{
		{"1+2", 3},
		{"2+3*4", 14},
		{"(2+3)*4", 20},
		{"10/4", 2.5},
		{"7-10", -3},
		{"2^10", 1024},
		{"2^3^2", 512},
		{"-2^2", -4},
		{"2^-1", 0.5},
		{"2*-3", -6},
		{"--2", 2},
		{"-(3+4)", -7},
		{"0.1+0.2", 0.30000000000000004},
		{"1e10*2", 2e10},
		{"1e-7/2", 5e-8},
		{"1E3+1", 1001},
		{" 1 + 1 ", 2},
		{"50%", 0.5},
		{"200*10%", 20},
		{"5%%", 0.0005},
		{"-5%", -0.05},
		{"sqrt(9)", 3},
		{"sqrt(2)", math.Sqrt2},
		{"sqrt(16)+sqrt(9)", 7},
		{"sqrt((1+3)*4)", 4},
		{"√9", 3},
		{"√(9)", 3},
		{"sqrt4", 2},
		{"sqrt 4", 2},
		{"√9+√16", 7},
		{"2*√9", 6},
		{"-√4", -2},
		{"√√16", 2},
		{"√4^2", 4},
		{".5*2", 1},
		{"0*5", 0},
		{"0/5", 0},
	}
	for _, tt := range tests {
		got, err := Calculate(tt.expr)
		if err != nil {
			t.Errorf("Calculate(%q) error: %v", tt.expr, err)
			continue
		}
		if got != tt.want {
			t.Errorf("Calculate(%q) = %v, want %v", tt.expr, got, tt.want)
		}
	}
}

func TestCalculateErrors(t *testing.T) {
	tests := []struct {
		expr string
		code string
	}{
		{"1/0", "division_by_zero"},
		{"-5/0", "division_by_zero"},
		{"0/0", "undefined_result"},
		{"0^-1", "division_by_zero"},
		{"sqrt(-1)", "undefined_result"},
		{"√-4", "undefined_result"},
		{"(-8)^0.5", "undefined_result"},
		{"1e308*10", "overflow"},
		{"1e999", "overflow"},
		{"2^9999", "overflow"},
		{"", "invalid_expression"},
		{"   ", "invalid_expression"},
		{"2+", "invalid_expression"},
		{"*2", "invalid_expression"},
		{"2++3", "invalid_expression"},
		{"2 3", "invalid_expression"},
		{"(2+3", "invalid_expression"},
		{"2+3)", "invalid_expression"},
		{"()", "invalid_expression"},
		{"2..3", "invalid_expression"},
		{"2$3", "invalid_expression"},
		{"abc", "invalid_expression"},
		{"abc(4)", "invalid_expression"},
		{"sqrt(4", "invalid_expression"},
		{"sqrt", "invalid_expression"},
		{"√", "invalid_expression"},
		{"2√4", "invalid_expression"},
		{"%5", "invalid_expression"},
		{"5(2)", "invalid_expression"},
		{"(2)3", "invalid_expression"},
		{"2sqrt(4)", "invalid_expression"},
	}
	for _, tt := range tests {
		_, err := Calculate(tt.expr)
		if err == nil {
			t.Errorf("Calculate(%q) expected error %s, got none", tt.expr, tt.code)
			continue
		}
		var ce *calcError
		if !errors.As(err, &ce) {
			t.Errorf("Calculate(%q) error is not *calcError: %v", tt.expr, err)
			continue
		}
		if ce.code != tt.code {
			t.Errorf("Calculate(%q) code = %s (%s), want %s", tt.expr, ce.code, ce.message, tt.code)
		}
	}
}
