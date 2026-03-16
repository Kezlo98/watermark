export namespace annotations {
	
	export class TopicAnnotation {
	    producers: string[];
	    consumers: string[];
	    notes?: string;
	    updatedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new TopicAnnotation(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.producers = source["producers"];
	        this.consumers = source["consumers"];
	        this.notes = source["notes"];
	        this.updatedAt = source["updatedAt"];
	    }
	}

}

export namespace config {
	
	export class AppSettings {
	    theme: string;
	    density: string;
	    codeFont: string;
	    codeFontSize: number;
	    launchOnStartup: boolean;
	    minimizeToTray: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AppSettings(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.theme = source["theme"];
	        this.density = source["density"];
	        this.codeFont = source["codeFont"];
	        this.codeFontSize = source["codeFontSize"];
	        this.launchOnStartup = source["launchOnStartup"];
	        this.minimizeToTray = source["minimizeToTray"];
	    }
	}
	export class ClusterProfile {
	    id: string;
	    name: string;
	    bootstrapServers: string;
	    color: string;
	    readOnly: boolean;
	    securityProtocol: string;
	    saslMechanism?: string;
	    username?: string;
	    password?: string;
	    schemaRegistryUrl?: string;
	    schemaRegistryPassword?: string;
	    awsProfile?: string;
	    awsRegion?: string;
	
	    static createFrom(source: any = {}) {
	        return new ClusterProfile(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.bootstrapServers = source["bootstrapServers"];
	        this.color = source["color"];
	        this.readOnly = source["readOnly"];
	        this.securityProtocol = source["securityProtocol"];
	        this.saslMechanism = source["saslMechanism"];
	        this.username = source["username"];
	        this.password = source["password"];
	        this.schemaRegistryUrl = source["schemaRegistryUrl"];
	        this.schemaRegistryPassword = source["schemaRegistryPassword"];
	        this.awsProfile = source["awsProfile"];
	        this.awsRegion = source["awsRegion"];
	    }
	}

}

export namespace kafka {
	
	export class AclEntry {
	    principal: string;
	    operation: string;
	    permissionType: string;
	    host: string;
	
	    static createFrom(source: any = {}) {
	        return new AclEntry(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.principal = source["principal"];
	        this.operation = source["operation"];
	        this.permissionType = source["permissionType"];
	        this.host = source["host"];
	    }
	}
	export class Broker {
	    id: number;
	    host: string;
	    port: number;
	    partitions: number;
	    size: number;
	    isController: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Broker(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.host = source["host"];
	        this.port = source["port"];
	        this.partitions = source["partitions"];
	        this.size = source["size"];
	        this.isController = source["isController"];
	    }
	}
	export class ClusterHealth {
	    status: string;
	    brokersOnline: number;
	    brokersTotal: number;
	    topicCount: number;
	    totalSize: number;
	
	    static createFrom(source: any = {}) {
	        return new ClusterHealth(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.status = source["status"];
	        this.brokersOnline = source["brokersOnline"];
	        this.brokersTotal = source["brokersTotal"];
	        this.topicCount = source["topicCount"];
	        this.totalSize = source["totalSize"];
	    }
	}
	export class ConsumerGroup {
	    groupId: string;
	    state: string;
	    members: number;
	    totalLag: number;
	
	    static createFrom(source: any = {}) {
	        return new ConsumerGroup(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.groupId = source["groupId"];
	        this.state = source["state"];
	        this.members = source["members"];
	        this.totalLag = source["totalLag"];
	    }
	}
	export class ConsumerGroupOffset {
	    topic: string;
	    partition: number;
	    host: string;
	    currentOffset: number;
	    endOffset: number;
	    lag: number;
	
	    static createFrom(source: any = {}) {
	        return new ConsumerGroupOffset(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.topic = source["topic"];
	        this.partition = source["partition"];
	        this.host = source["host"];
	        this.currentOffset = source["currentOffset"];
	        this.endOffset = source["endOffset"];
	        this.lag = source["lag"];
	    }
	}
	export class ConsumerGroupMember {
	    clientId: string;
	    host: string;
	    assignedPartitions: number[];
	
	    static createFrom(source: any = {}) {
	        return new ConsumerGroupMember(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.clientId = source["clientId"];
	        this.host = source["host"];
	        this.assignedPartitions = source["assignedPartitions"];
	    }
	}
	export class ConsumerGroupDetail {
	    groupId: string;
	    state: string;
	    coordinator: number;
	    members: ConsumerGroupMember[];
	    offsets: ConsumerGroupOffset[];
	
	    static createFrom(source: any = {}) {
	        return new ConsumerGroupDetail(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.groupId = source["groupId"];
	        this.state = source["state"];
	        this.coordinator = source["coordinator"];
	        this.members = this.convertValues(source["members"], ConsumerGroupMember);
	        this.offsets = this.convertValues(source["offsets"], ConsumerGroupOffset);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	
	export class DashboardData {
	    health?: ClusterHealth;
	    brokers: Broker[];
	
	    static createFrom(source: any = {}) {
	        return new DashboardData(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.health = this.convertValues(source["health"], ClusterHealth);
	        this.brokers = this.convertValues(source["brokers"], Broker);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class Message {
	    partition: number;
	    offset: number;
	    timestamp: string;
	    key: string;
	    value: string;
	    headers?: Record<string, string>;
	
	    static createFrom(source: any = {}) {
	        return new Message(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.partition = source["partition"];
	        this.offset = source["offset"];
	        this.timestamp = source["timestamp"];
	        this.key = source["key"];
	        this.value = source["value"];
	        this.headers = source["headers"];
	    }
	}
	export class Partition {
	    id: number;
	    leader: number;
	    replicas: number[];
	    isr: number[];
	    lowWatermark: number;
	    highWatermark: number;
	
	    static createFrom(source: any = {}) {
	        return new Partition(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.leader = source["leader"];
	        this.replicas = source["replicas"];
	        this.isr = source["isr"];
	        this.lowWatermark = source["lowWatermark"];
	        this.highWatermark = source["highWatermark"];
	    }
	}
	export class Topic {
	    name: string;
	    partitions: number;
	    replicas: number;
	    size: number;
	    retention: string;
	    isInternal: boolean;
	
	    static createFrom(source: any = {}) {
	        return new Topic(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.partitions = source["partitions"];
	        this.replicas = source["replicas"];
	        this.size = source["size"];
	        this.retention = source["retention"];
	        this.isInternal = source["isInternal"];
	    }
	}
	export class TopicConfig {
	    name: string;
	    value: string;
	    defaultValue: string;
	    isOverridden: boolean;
	    description: string;
	
	    static createFrom(source: any = {}) {
	        return new TopicConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.value = source["value"];
	        this.defaultValue = source["defaultValue"];
	        this.isOverridden = source["isOverridden"];
	        this.description = source["description"];
	    }
	}

}

export namespace lagalert {
	
	export class AlertEvent {
	    id: string;
	    clusterId: string;
	    groupId: string;
	    matchedRule: string;
	    rulePattern: string;
	    level: string;
	    lag: number;
	    threshold: number;
	    // Go type: time
	    timestamp: any;
	    resolved: boolean;
	    // Go type: time
	    resolvedAt?: any;
	    read: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AlertEvent(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.clusterId = source["clusterId"];
	        this.groupId = source["groupId"];
	        this.matchedRule = source["matchedRule"];
	        this.rulePattern = source["rulePattern"];
	        this.level = source["level"];
	        this.lag = source["lag"];
	        this.threshold = source["threshold"];
	        this.timestamp = this.convertValues(source["timestamp"], null);
	        this.resolved = source["resolved"];
	        this.resolvedAt = this.convertValues(source["resolvedAt"], null);
	        this.read = source["read"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	export class AlertRule {
	    id: string;
	    groupPattern: string;
	    warningLag: number;
	    criticalLag: number;
	    enabled: boolean;
	
	    static createFrom(source: any = {}) {
	        return new AlertRule(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.groupPattern = source["groupPattern"];
	        this.warningLag = source["warningLag"];
	        this.criticalLag = source["criticalLag"];
	        this.enabled = source["enabled"];
	    }
	}
	export class ClusterAlertConfig {
	    enabled: boolean;
	    pollIntervalSec: number;
	    notifyOS: boolean;
	    notificationSound: boolean;
	    rules: AlertRule[];
	
	    static createFrom(source: any = {}) {
	        return new ClusterAlertConfig(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.enabled = source["enabled"];
	        this.pollIntervalSec = source["pollIntervalSec"];
	        this.notifyOS = source["notifyOS"];
	        this.notificationSound = source["notificationSound"];
	        this.rules = this.convertValues(source["rules"], AlertRule);
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}

}

export namespace schema {
	
	export class SchemaSubject {
	    name: string;
	    latestVersion: number;
	    type: string;
	    compatibility: string;
	
	    static createFrom(source: any = {}) {
	        return new SchemaSubject(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.name = source["name"];
	        this.latestVersion = source["latestVersion"];
	        this.type = source["type"];
	        this.compatibility = source["compatibility"];
	    }
	}
	export class SchemaVersion {
	    version: number;
	    id: number;
	    schema: string;
	    type: string;
	    date?: string;
	    description?: string;
	
	    static createFrom(source: any = {}) {
	        return new SchemaVersion(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.version = source["version"];
	        this.id = source["id"];
	        this.schema = source["schema"];
	        this.type = source["type"];
	        this.date = source["date"];
	        this.description = source["description"];
	    }
	}

}

export namespace updater {
	
	export class UpdateInfo {
	    available: boolean;
	    currentVersion: string;
	    latestVersion: string;
	    releaseUrl: string;
	    releaseNotes: string;
	    publishedAt: string;
	
	    static createFrom(source: any = {}) {
	        return new UpdateInfo(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.available = source["available"];
	        this.currentVersion = source["currentVersion"];
	        this.latestVersion = source["latestVersion"];
	        this.releaseUrl = source["releaseUrl"];
	        this.releaseNotes = source["releaseNotes"];
	        this.publishedAt = source["publishedAt"];
	    }
	}

}

