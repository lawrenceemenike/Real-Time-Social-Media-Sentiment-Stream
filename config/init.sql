-- PostgreSQL Schema initialization for ComIntel

CREATE TABLE IF NOT EXISTS entity_metrics_hourly (
    id SERIAL PRIMARY KEY,
    entity_name VARCHAR(64) NOT NULL,
    watchlist VARCHAR(32) NOT NULL,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    mention_count INT NOT NULL DEFAULT 0,
    positive_count INT NOT NULL DEFAULT 0,
    neutral_count INT NOT NULL DEFAULT 0,
    negative_count INT NOT NULL DEFAULT 0,
    net_sentiment FLOAT NOT NULL DEFAULT 0.0,
    share_of_voice FLOAT NOT NULL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS anomaly_alerts (
    alert_id VARCHAR(32) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    entity_name VARCHAR(64) NOT NULL,
    watchlist VARCHAR(32) NOT NULL,
    metric VARCHAR(64) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    baseline_mean FLOAT NOT NULL,
    current_value FLOAT NOT NULL,
    z_score FLOAT NOT NULL,
    associated_topics JSONB,
    sample_text TEXT,
    executive_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trace_spans (
    span_id VARCHAR(64) PRIMARY KEY,
    trace_id VARCHAR(64) NOT NULL,
    event_id VARCHAR(64) NOT NULL,
    component VARCHAR(64) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_ms FLOAT NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'OK',
    metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_entity_metrics_window ON entity_metrics_hourly(entity_name, window_start);
CREATE INDEX IF NOT EXISTS idx_anomaly_alerts_time ON anomaly_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_trace_spans_trace ON trace_spans(trace_id);
