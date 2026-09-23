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

func doEvaluate(t *testing.T, method, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, "/api/v1/evaluate", strings.NewReader(body))
	rec := httptest.NewRecorder()
	newMux().ServeHTTP(rec, req)
	return rec
}

func TestEvaluateEndpointSuccess(t *testing.T) {
	tests := []struct {
		body string
		want float64
	}{
		{`{"latex": "2+2"}`, 4},
		{`{"latex": "0.1+0.2"}`, 0.30000000000000004},
		{`{"latex": "\\frac{\\sqrt{2}^2}{2}"}`, 1.0000000000000002},
	}
	for _, tt := range tests {
		rec := doEvaluate(t, http.MethodPost, tt.body)
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

func TestEvaluateEndpointErrors(t *testing.T) {
	tests := []struct {
		name   string
		body   string
		status int
		code   string
	}{
		{"division by zero", `{"latex": "\\frac{1}{0}"}`, 422, "division_by_zero"},
		{"syntax error", `{"latex": "2+*"}`, 422, "invalid_expression"},
		{"unsupported", `{"latex": "x+1"}`, 422, "unsupported"},
		{"overflow", `{"latex": "1e308*10"}`, 422, "overflow"},
		{"malformed JSON", `{`, 400, "invalid_request"},
		{"wrong type", `{"latex": 5}`, 400, "invalid_request"},
		{"missing field", `{}`, 400, "invalid_request"},
		{"unknown field", `{"expression": "1"}`, 400, "invalid_request"},
		{"empty body", ``, 400, "invalid_request"},
		{"empty latex", `{"latex": ""}`, 400, "invalid_request"},
		{"blank latex", `{"latex": "  "}`, 400, "invalid_request"},
		{"null latex", `{"latex": null}`, 400, "invalid_request"},
		{"trailing data", `{"latex": "1"}{"a":1}`, 400, "invalid_request"},
		{"too long", `{"latex": "1` + strings.Repeat("+1", 600) + `"}`, 400, "invalid_request"},
	}
	for _, tt := range tests {
		rec := doEvaluate(t, http.MethodPost, tt.body)
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

// The tree comes back with a value and with evaluation errors, so guides can
// explain 1/0; parse errors have no tree to return.
func TestEvaluateEndpointTree(t *testing.T) {
	tests := []struct {
		body, tree string
	}{
		{`{"latex": "\\sqrt{3^2+4^2}"}`, `["Sqrt",["Add",["Power",3,2],["Power",4,2]]]`},
		{`{"latex": "\\frac{1}{0}"}`, `["Divide",1,0]`},
		{`{"latex": "2+"}`, ``},
	}
	for _, tt := range tests {
		rec := doEvaluate(t, http.MethodPost, tt.body)
		var got struct {
			Tree json.RawMessage `json:"tree"`
		}
		if err := json.Unmarshal(rec.Body.Bytes(), &got); err != nil {
			t.Fatalf("%s: bad JSON: %v", tt.body, err)
		}
		if string(got.Tree) != tt.tree {
			t.Errorf("%s: tree = %s, want %s", tt.body, got.Tree, tt.tree)
		}
	}
}

func TestEvaluateEndpointMethodNotAllowed(t *testing.T) {
	rec := doEvaluate(t, http.MethodGet, "")
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

func TestSecurityHeaders(t *testing.T) {
	req := httptest.NewRequest(http.MethodPost, "/api/v1/evaluate", strings.NewReader(`{"latex": "1+1"}`))
	rec := httptest.NewRecorder()
	handler().ServeHTTP(rec, req)
	if got := rec.Header().Get("X-Content-Type-Options"); got != "nosniff" {
		t.Errorf("X-Content-Type-Options = %q", got)
	}
	if got := rec.Header().Get("Content-Security-Policy"); !strings.Contains(got, "default-src 'self'") {
		t.Errorf("Content-Security-Policy = %q", got)
	}
	if got := rec.Header().Get("Referrer-Policy"); got != "no-referrer" {
		t.Errorf("Referrer-Policy = %q", got)
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
