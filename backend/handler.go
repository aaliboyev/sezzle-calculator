package main

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"unicode/utf8"
)

const maxLatexRunes = 1000

type evaluateRequest struct {
	Latex *string `json:"latex"`
}

// The tree rides along with evaluation errors too: a guide can still explain
// 1/0 even though it has no value.
type evaluateResponse struct {
	Result *float64  `json:"result,omitempty"`
	Tree   *node     `json:"tree,omitempty"`
	Error  *apiError `json:"error,omitempty"`
}

type apiError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	writeJSON(w, status, map[string]apiError{"error": {code, message}})
}

func decodeErrMessage(err error) string {
	var typeErr *json.UnmarshalTypeError
	var maxErr *http.MaxBytesError
	switch {
	case errors.As(err, &typeErr):
		return `"latex" must be a string`
	case errors.As(err, &maxErr):
		return "request body too large"
	case errors.Is(err, io.EOF):
		return "request body is empty"
	default:
		return `request body must be JSON: {"latex": "<string>"}`
	}
}

func handleEvaluate(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		w.Header().Set("Allow", http.MethodPost)
		writeError(w, http.StatusMethodNotAllowed, "method_not_allowed", "use POST")
		return
	}
	r.Body = http.MaxBytesReader(w, r.Body, 64*1024)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	var req evaluateRequest
	if err := dec.Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", decodeErrMessage(err))
		return
	}
	if dec.More() {
		writeError(w, http.StatusBadRequest, "invalid_request", "request body has trailing data")
		return
	}
	if req.Latex == nil || strings.TrimSpace(*req.Latex) == "" {
		writeError(w, http.StatusBadRequest, "invalid_request", `"latex" is required and must be a non-empty string`)
		return
	}
	if utf8.RuneCountInString(*req.Latex) > maxLatexRunes {
		writeError(w, http.StatusBadRequest, "invalid_request", "latex exceeds 1000 characters")
		return
	}
	tree, err := parseLatex(*req.Latex)
	if err != nil {
		writeCalcError(w, nil, err)
		return
	}
	result, err := evaluate(tree)
	if err != nil {
		writeCalcError(w, tree, err)
		return
	}
	writeJSON(w, http.StatusOK, evaluateResponse{Result: &result, Tree: tree})
}

func writeCalcError(w http.ResponseWriter, tree *node, err error) {
	var ce *calcError
	if !errors.As(err, &ce) {
		writeError(w, http.StatusInternalServerError, "internal", "internal error")
		return
	}
	writeJSON(w, http.StatusUnprocessableEntity, evaluateResponse{Tree: tree, Error: &apiError{ce.code, ce.message}})
}
