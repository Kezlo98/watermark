package kafka

import (
	"fmt"

	"github.com/twmb/franz-go/pkg/kadm"
	"github.com/twmb/franz-go/pkg/kmsg"
)

// GetTopicACLs returns ACL entries for a specific topic.
func (k *KafkaService) GetTopicACLs(topicName string) ([]AclEntry, error) {
	k.mu.RLock()
	defer k.mu.RUnlock()

	if err := k.ensureConnected(); err != nil {
		return nil, err
	}

	ctx := k.getCtx()

	// Build ACL filter for the topic resource
	var filter kadm.ACLBuilder
	filter.Topics(topicName).
		ResourcePatternType(kadm.ACLPatternLiteral).
		Operations(kadm.OpAny).
		Allow()

	results, err := k.admin.DescribeACLs(ctx, &filter)
	if err != nil {
		// ACL operations may fail due to permissions — return empty
		return []AclEntry{}, nil
	}

	var entries []AclEntry
	for _, r := range results {
		if r.Err != nil {
			continue
		}
		for _, d := range r.Described {
			entries = append(entries, AclEntry{
				Principal:      d.Principal,
				Operation:      aclOperationString(d.Operation),
				PermissionType: aclPermissionString(d.Permission),
				Host:           d.Host,
			})
		}
	}

	// Also fetch deny ACLs
	var denyFilter kadm.ACLBuilder
	denyFilter.Topics(topicName).
		ResourcePatternType(kadm.ACLPatternLiteral).
		Operations(kadm.OpAny).
		Deny()

	denyResults, err := k.admin.DescribeACLs(ctx, &denyFilter)
	if err == nil {
		for _, r := range denyResults {
			if r.Err != nil {
				continue
			}
			for _, d := range r.Described {
				entries = append(entries, AclEntry{
					Principal:      d.Principal,
					Operation:      aclOperationString(d.Operation),
					PermissionType: aclPermissionString(d.Permission),
					Host:           d.Host,
				})
			}
		}
	}

	if entries == nil {
		return []AclEntry{}, nil
	}

	return entries, nil
}

// aclOperationString converts kadm.ACLOperation to string.
func aclOperationString(op kadm.ACLOperation) string {
	switch op {
	case kmsg.ACLOperationRead:
		return "Read"
	case kmsg.ACLOperationWrite:
		return "Write"
	case kmsg.ACLOperationCreate:
		return "Create"
	case kmsg.ACLOperationDelete:
		return "Delete"
	case kmsg.ACLOperationAlter:
		return "Alter"
	case kmsg.ACLOperationDescribe:
		return "Describe"
	case kmsg.ACLOperationAll:
		return "All"
	default:
		return fmt.Sprintf("Unknown(%d)", op)
	}
}

// aclPermissionString converts kmsg.ACLPermissionType to string.
func aclPermissionString(pt kmsg.ACLPermissionType) string {
	switch pt {
	case kmsg.ACLPermissionTypeAllow:
		return "Allow"
	case kmsg.ACLPermissionTypeDeny:
		return "Deny"
	default:
		return "Unknown"
	}
}
