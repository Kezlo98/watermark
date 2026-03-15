package kafka

import (
	"encoding/json"
	"testing"
)

func TestBrokerJSON(t *testing.T) {
	b := Broker{ID: 1, Host: "localhost", Port: 9092, Partitions: 10, Size: 1024, IsController: true}
	data, _ := json.Marshal(b)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	expectedKeys := []string{"id", "host", "port", "partitions", "size", "isController"}
	for _, key := range expectedKeys {
		if _, ok := m[key]; !ok {
			t.Errorf("expected camelCase key %q in JSON output", key)
		}
	}
}

func TestTopicJSON(t *testing.T) {
	topic := Topic{Name: "test", Partitions: 3, Replicas: 2, Size: 2048, Retention: "7d", IsInternal: false}
	data, _ := json.Marshal(topic)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	expectedKeys := []string{"name", "partitions", "replicas", "size", "retention", "isInternal"}
	for _, key := range expectedKeys {
		if _, ok := m[key]; !ok {
			t.Errorf("expected camelCase key %q in JSON output", key)
		}
	}
}

func TestPartitionJSON(t *testing.T) {
	p := Partition{ID: 0, Leader: 1, Replicas: []int32{1, 2}, ISR: []int32{1, 2}, LowWatermark: 0, HighWatermark: 100}
	data, _ := json.Marshal(p)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	checkKeys := []string{"id", "leader", "replicas", "isr", "lowWatermark", "highWatermark"}
	for _, key := range checkKeys {
		if _, ok := m[key]; !ok {
			t.Errorf("expected camelCase key %q", key)
		}
	}
}

func TestMessageJSON(t *testing.T) {
	msg := Message{Partition: 0, Offset: 42, Timestamp: "2024-01-01T00:00:00Z", Key: "k", Value: "v", Headers: map[string]string{"h": "1"}}
	data, _ := json.Marshal(msg)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"partition", "offset", "timestamp", "key", "value", "headers"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestConsumerGroupJSON(t *testing.T) {
	cg := ConsumerGroup{GroupID: "g1", State: "Stable", Members: 3, TotalLag: 100}
	data, _ := json.Marshal(cg)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"groupId", "state", "members", "totalLag"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestConsumerGroupDetailJSON(t *testing.T) {
	cgd := ConsumerGroupDetail{
		GroupID:     "g1",
		State:       "Stable",
		Coordinator: 1,
		Members: []ConsumerGroupMember{
			{ClientID: "c1", Host: "h1", AssignedPartitions: []int32{0, 1}},
		},
		Offsets: []ConsumerGroupOffset{
			{Topic: "t1", Partition: 0, CurrentOffset: 50, EndOffset: 100, Lag: 50},
		},
	}
	data, _ := json.Marshal(cgd)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"groupId", "state", "coordinator", "members", "offsets"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestClusterHealthJSON(t *testing.T) {
	ch := ClusterHealth{Status: "healthy", BrokersOnline: 3, BrokersTotal: 3, TopicCount: 10, TotalSize: 1048576}
	data, _ := json.Marshal(ch)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"status", "brokersOnline", "brokersTotal", "topicCount", "totalSize"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestTopicConfigJSON(t *testing.T) {
	tc := TopicConfig{Name: "retention.ms", Value: "604800000", DefaultValue: "-1", IsOverridden: true, Description: ""}
	data, _ := json.Marshal(tc)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"name", "value", "defaultValue", "isOverridden", "description"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestAclEntryJSON(t *testing.T) {
	acl := AclEntry{Principal: "User:admin", Operation: "Read", PermissionType: "Allow", Host: "*"}
	data, _ := json.Marshal(acl)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"principal", "operation", "permissionType", "host"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestProduceMessageRequestJSON(t *testing.T) {
	req := ProduceMessageRequest{
		Partition: 2,
		Key:       "my-key",
		Value:     `{"event":"test"}`,
		Headers:   map[string]string{"Content-Type": "application/json"},
	}
	data, _ := json.Marshal(req)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"partition", "key", "value", "headers"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestProduceMessageRequestOmitsEmptyHeaders(t *testing.T) {
	req := ProduceMessageRequest{Partition: 0, Key: "k", Value: "v"}
	data, _ := json.Marshal(req)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	if _, ok := m["headers"]; ok {
		t.Error("headers should be omitted when nil")
	}
}

func TestProduceResultJSON(t *testing.T) {
	r := ProduceResult{Index: 3, Partition: 1, Offset: 42}
	data, _ := json.Marshal(r)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"index", "partition", "offset"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
	// error field should be omitted when empty
	if _, ok := m["error"]; ok {
		t.Error("error should be omitted when empty")
	}
}

func TestProduceResultWithErrorJSON(t *testing.T) {
	r := ProduceResult{Index: 0, Partition: 0, Offset: 0, Error: "broker unavailable"}
	data, _ := json.Marshal(r)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	if v, ok := m["error"]; !ok || v != "broker unavailable" {
		t.Errorf("expected error field to be %q, got %v", "broker unavailable", v)
	}
}

func TestConsumerGroupMemberJSON(t *testing.T) {
	m := ConsumerGroupMember{ClientID: "c1", Host: "/1.2.3.4", AssignedPartitions: []int32{0, 1, 2}}
	data, _ := json.Marshal(m)

	var decoded map[string]interface{}
	json.Unmarshal(data, &decoded)

	for _, key := range []string{"clientId", "host", "assignedPartitions"} {
		if _, ok := decoded[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}

func TestConsumerGroupOffsetJSON(t *testing.T) {
	o := ConsumerGroupOffset{Topic: "t1", Partition: 0, CurrentOffset: 100, EndOffset: 200, Lag: 100}
	data, _ := json.Marshal(o)

	var m map[string]interface{}
	json.Unmarshal(data, &m)

	for _, key := range []string{"topic", "partition", "currentOffset", "endOffset", "lag"} {
		if _, ok := m[key]; !ok {
			t.Errorf("expected key %q", key)
		}
	}
}
