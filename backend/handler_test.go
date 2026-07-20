package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type errEnvelope struct {
	Error apiError `json:"error"`
}

func doCalculate(t *testing.T, method, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, "/api/v1/calculate", strings.NewReader(body))
	rec := httptest.NewRecorder()
	newMux().ServeHTTP(rec, req)
	return rec
}

func TestCalculateEndpointSuccess(t *testing.T) {
	tests := []struct {
		body string
		want float64
	}{
		{`{"expression": "2+2"}`, 4},
		{`{"expression": "0.1+0.2"}`, 0.30000000000000004},
		{`{"expression": "sqrt(2)^2/2"}`, 1.0000000000000002},
	}
	for _, tt := range tests {
		rec := doCalculate(t, http.MethodPost, tt.body)
		if rec.Code != http.StatusOK {
			t.Errorf("%s: status = %d, body %s", tt.body, rec.Code, rec.Body)
			continue
		}
		var got struct {
			Result float64 `json:"result"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Errorf("%s: bad response JSON: %v", tt.body, err)
			continue
		}
		if got.Result != tt.want {
			t.Errorf("%s: result = %v, want %v", tt.body, got.Result, tt.want)
		}
	}
}

func TestCalculateEndpointErrors(t *testing.T) {
	tests := []struct {
		name   string
		body   string
		status int
		code   string
	}{
		{"division by zero", `{"expression": "1/0"}`, 422, "division_by_zero"},
		{"syntax error", `{"expression": "2++"}`, 422, "invalid_expression"},
		{"overflow", `{"expression": "1e308*10"}`, 422, "overflow"},
		{"malformed JSON", `{`, 400, "invalid_request"},
		{"wrong type", `{"expression": 5}`, 400, "invalid_request"},
		{"missing field", `{}`, 400, "invalid_request"},
		{"unknown field", `{"expr": "1"}`, 400, "invalid_request"},
		{"empty body", ``, 400, "invalid_request"},
		{"empty expression", `{"expression": ""}`, 400, "invalid_request"},
		{"blank expression", `{"expression": "  "}`, 400, "invalid_request"},
		{"null expression", `{"expression": null}`, 400, "invalid_request"},
		{"trailing data", `{"expression": "1"}{"a":1}`, 400, "invalid_request"},
		{"too long", `{"expression": "1` + strings.Repeat("+1", 600) + `"}`, 400, "invalid_request"},
	}
	for _, tt := range tests {
		rec := doCalculate(t, http.MethodPost, tt.body)
		if rec.Code != tt.status {
			t.Errorf("%s: status = %d, want %d (body %s)", tt.name, rec.Code, tt.status, rec.Body)
			continue
		}
		var got errEnvelope
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Errorf("%s: bad error JSON: %v", tt.name, err)
			continue
		}
		if got.Error.Code != tt.code {
			t.Errorf("%s: code = %s, want %s", tt.name, got.Error.Code, tt.code)
		}
		if got.Error.Message == "" {
			t.Errorf("%s: error message is empty", tt.name)
		}
	}
}

func TestCalculateEndpointMethodNotAllowed(t *testing.T) {
	rec := doCalculate(t, http.MethodGet, "")
	if rec.Code != http.StatusMethodNotAllowed {
		t.Fatalf("status = %d, want 405", rec.Code)
	}
	var got errEnvelope
	if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
		t.Fatalf("bad error JSON: %v", err)
	}
	if got.Error.Code != "method_not_allowed" {
		t.Fatalf("code = %s", got.Error.Code)
	}
}

func TestHealth(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	rec := httptest.NewRecorder()
	newMux().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}
}
