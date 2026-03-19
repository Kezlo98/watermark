package kafka

import "testing"

func TestResolveStartOffsetFromEndOffsets(t *testing.T) {
	tests := []struct {
		name      string
		endOffset int64
		start     int64
		limit     int
		want      int64
	}{
		{"earliest returns 0", 100, -2, 50, 0},
		{"explicit offset returned as-is", 100, 10, 50, 10},
		{"explicit offset 0", 100, 0, 50, 0},
		{"latest: end - limit", 100, -1, 20, 80},
		{"latest: clamps to 0 when limit > end", 10, -1, 50, 0},
		{"latest: end == limit", 50, -1, 50, 0},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := resolveStartOffsetFromEndOffsets(tc.endOffset, tc.start, tc.limit)
			if got != tc.want {
				t.Errorf("got %d, want %d", got, tc.want)
			}
		})
	}
}
