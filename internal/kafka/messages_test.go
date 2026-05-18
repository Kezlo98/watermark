package kafka

import (
	"testing"
)

func TestResolveStartOffsetFromEndOffsets(t *testing.T) {
	tests := []struct {
		name         string
		endOffset    int64
		start        int64
		perPartition int
		want         int64
	}{
		{"earliest returns 0", 100, -2, 50, 0},
		{"explicit offset returned as-is", 100, 10, 50, 10},
		{"explicit offset 0", 100, 0, 50, 0},
		{"latest: end - perPartition", 100, -1, 20, 80},
		{"latest: clamps to 0 when budget > end", 10, -1, 50, 0},
		{"latest: end == perPartition", 50, -1, 50, 0},
		{"latest: large budget", 1000, -1, 200, 800},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := resolveStartOffsetFromEndOffsets(tc.endOffset, tc.start, tc.perPartition)
			if got != tc.want {
				t.Errorf("got %d, want %d", got, tc.want)
			}
		})
	}
}

func TestClampedBudget(t *testing.T) {
	tests := []struct {
		name           string
		limit          int
		partitionCount int
		wantPer        int
		wantCap        int
	}{
		// P=1: perPartition = max(limit, ceil(limit/1)*2) = limit*2; cap = perPartition*1
		{"P=1 limit=50", 50, 1, 100, 100},
		{"P=1 limit=200", 200, 1, 400, 400},
		// P=3: ceil(50/3)*2=34 < 50 → perPartition=50; cap=150
		{"P=3 limit=50", 50, 3, 50, 150},
		// P=3: ceil(200/3)*2=134 < 200 → perPartition=200; cap=600
		{"P=3 limit=200", 200, 3, 200, 600},
		// P=10: ceil(200/10)*2=40 < 200 → perPartition=200; cap=2000
		{"P=10 limit=200", 200, 10, 200, 2000},
		// P=100: perPartition=200; cap=20000 > 5000 → cap=5000, per=50
		{"P=100 limit=200", 200, 100, 50, 5000},
		// P=10: ceil(1000/10)*2=200 < 1000 → perPartition=1000; cap=10000 > 5000 → cap=5000, per=500
		{"P=10 limit=1000", 1000, 10, 500, 5000},
		// P=100: perPartition=1000; cap=100000 > 5000 → cap=5000, per=50
		{"P=100 limit=1000", 1000, 100, 50, 5000},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			gotPer, gotCap := clampedBudget(tc.limit, tc.partitionCount)
			if gotPer != tc.wantPer {
				t.Errorf("perPartition: got %d, want %d", gotPer, tc.wantPer)
			}
			if gotCap != tc.wantCap {
				t.Errorf("totalCap: got %d, want %d", gotCap, tc.wantCap)
			}
		})
	}
}

func TestMergeSortTrim(t *testing.T) {
	msg := func(ts, partition string, p int32, offset int64) Message {
		return Message{Timestamp: ts, Partition: p, Offset: offset}
	}

	t.Run("empty input", func(t *testing.T) {
		got := mergeSortTrim(nil, 10, false)
		if len(got) != 0 {
			t.Errorf("expected empty, got %d", len(got))
		}
	})

	t.Run("single element", func(t *testing.T) {
		msgs := []Message{msg("2024-01-01T00:00:00Z", "", 0, 0)}
		got := mergeSortTrim(msgs, 10, false)
		if len(got) != 1 {
			t.Errorf("expected 1, got %d", len(got))
		}
	})

	t.Run("ASC trims to earliest N", func(t *testing.T) {
		msgs := []Message{
			msg("2024-01-03T00:00:00Z", "", 0, 2),
			msg("2024-01-01T00:00:00Z", "", 0, 0),
			msg("2024-01-02T00:00:00Z", "", 0, 1),
		}
		got := mergeSortTrim(msgs, 2, false)
		if len(got) != 2 {
			t.Fatalf("expected 2, got %d", len(got))
		}
		if got[0].Timestamp != "2024-01-01T00:00:00Z" {
			t.Errorf("first should be earliest, got %s", got[0].Timestamp)
		}
		if got[1].Timestamp != "2024-01-02T00:00:00Z" {
			t.Errorf("second should be middle, got %s", got[1].Timestamp)
		}
	})

	t.Run("DESC trims to latest N", func(t *testing.T) {
		msgs := []Message{
			msg("2024-01-01T00:00:00Z", "", 0, 0),
			msg("2024-01-03T00:00:00Z", "", 0, 2),
			msg("2024-01-02T00:00:00Z", "", 0, 1),
		}
		got := mergeSortTrim(msgs, 2, true)
		if len(got) != 2 {
			t.Fatalf("expected 2, got %d", len(got))
		}
		if got[0].Timestamp != "2024-01-03T00:00:00Z" {
			t.Errorf("first should be latest, got %s", got[0].Timestamp)
		}
		if got[1].Timestamp != "2024-01-02T00:00:00Z" {
			t.Errorf("second should be middle, got %s", got[1].Timestamp)
		}
	})

	t.Run("stable secondary sort by partition then offset", func(t *testing.T) {
		ts := "2024-01-01T00:00:00Z"
		msgs := []Message{
			{Timestamp: ts, Partition: 1, Offset: 5},
			{Timestamp: ts, Partition: 0, Offset: 10},
			{Timestamp: ts, Partition: 0, Offset: 3},
		}
		got := mergeSortTrim(msgs, 10, false)
		if got[0].Partition != 0 || got[0].Offset != 3 {
			t.Errorf("expected p=0 o=3 first, got p=%d o=%d", got[0].Partition, got[0].Offset)
		}
		if got[1].Partition != 0 || got[1].Offset != 10 {
			t.Errorf("expected p=0 o=10 second, got p=%d o=%d", got[1].Partition, got[1].Offset)
		}
		if got[2].Partition != 1 || got[2].Offset != 5 {
			t.Errorf("expected p=1 o=5 third, got p=%d o=%d", got[2].Partition, got[2].Offset)
		}
	})

	t.Run("no trim when len <= limit", func(t *testing.T) {
		msgs := []Message{
			msg("2024-01-01T00:00:00Z", "", 0, 0),
			msg("2024-01-02T00:00:00Z", "", 0, 1),
		}
		got := mergeSortTrim(msgs, 5, false)
		if len(got) != 2 {
			t.Errorf("expected 2, got %d", len(got))
		}
	})
}
