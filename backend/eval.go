package main

import "math"

func evaluate(n *node) (float64, error) {
	if n.op == "" {
		return n.num, nil
	}
	args := make([]float64, len(n.args))
	for i, a := range n.args {
		v, err := evaluate(a)
		if err != nil {
			return 0, err
		}
		args[i] = v
	}
	res, err := applyOp(n.op, args)
	if err != nil {
		return 0, err
	}
	if math.IsInf(res, 0) {
		return 0, &calcError{"overflow", "result exceeds the range of a 64-bit float"}
	}
	if math.IsNaN(res) {
		return 0, &calcError{"undefined_result", "result is undefined"}
	}
	return res, nil
}

func applyOp(op string, args []float64) (float64, error) {
	switch op {
	case "Add":
		sum := 0.0
		for _, v := range args {
			sum += v
		}
		return sum, nil
	case "Multiply":
		product := 1.0
		for _, v := range args {
			product *= v
		}
		return product, nil
	case "Subtract":
		return args[0] - args[1], nil
	case "Negate":
		return -args[0], nil
	case "Divide":
		a, b := args[0], args[1]
		if b == 0 {
			if a == 0 {
				return 0, &calcError{"undefined_result", "0/0 is undefined"}
			}
			return 0, &calcError{"division_by_zero", "division by zero"}
		}
		return a / b, nil
	case "Power":
		if args[0] == 0 && args[1] < 0 {
			return 0, &calcError{"division_by_zero", "zero raised to a negative power"}
		}
		return math.Pow(args[0], args[1]), nil
	case "Sqrt":
		if args[0] < 0 {
			return 0, &calcError{"undefined_result", "square root of a negative number is undefined"}
		}
		return math.Sqrt(args[0]), nil
	case "Root":
		return root(args[0], args[1])
	}
	return 0, unsupported(op)
}

// Odd integer roots of negatives are real: ∛-8 = -2.
func root(x, index float64) (float64, error) {
	if index == 0 {
		return 0, &calcError{"undefined_result", "a root of index 0 is undefined"}
	}
	if x >= 0 {
		return exactRoot(x, index), nil
	}
	if index == math.Trunc(index) && math.Mod(index, 2) != 0 {
		return -exactRoot(-x, index), nil
	}
	return 0, &calcError{"undefined_result", "this root of a negative number is undefined"}
}

// x^(1/n) lands just off exact roots (27^(1/3) = 2.9999999999999996); snap
// to the integer when raising it back reproduces x exactly.
func exactRoot(x, index float64) float64 {
	r := math.Pow(x, 1/index)
	if k := math.Round(r); math.Pow(k, index) == x {
		return k
	}
	return r
}
