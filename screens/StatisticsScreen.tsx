import { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { APIDataReader } from '../APIDataReader';
import { useLanguage } from '../context/LanguageContext';

type LastUpdateRow = {
  sensorId: string;
  lastUpdate: string;
};

type MetricRow = {
  metric: string;
  value: string;
};

function parseMetricRows(payload: unknown): MetricRow[] {
  const rows: MetricRow[] = [];
  const visited = new WeakSet<object>();

  const addRow = (metric: string, value: unknown) => {
    if (!metric) {
      return;
    }

    if (value === null || value === undefined) {
      rows.push({ metric, value: '—' });
      return;
    }

    if (typeof value === 'object') {
      rows.push({ metric, value: JSON.stringify(value) });
      return;
    }

    rows.push({ metric, value: String(value) });
  };

  const visit = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      if (node.length === 0) {
        addRow(path, '[]');
        return;
      }

      node.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }

    if (!node || typeof node !== 'object') {
      addRow(path, node);
      return;
    }

    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    const record = node as Record<string, unknown>;
    const entries = Object.entries(record);

    if (entries.length === 0) {
      addRow(path, '{}');
      return;
    }

    for (const [key, value] of entries) {
      const nextPath = path ? `${path}.${key}` : key;
      if (value !== null && typeof value === 'object') {
        visit(value, nextPath);
      } else {
        addRow(nextPath, value);
      }
    }
  };

  visit(payload, '');

  return rows.map((row) => ({
    metric: row.metric || 'value',
    value: row.value,
  }));
}

function extractFirstNumber(payload: unknown, preferredKeys: string[] = []): number | null {
  if (typeof payload === 'number' && Number.isFinite(payload)) {
    return payload;
  }

  if (typeof payload === 'string' && payload.trim()) {
    const parsed = Number(payload);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const record = payload as Record<string, unknown>;

  for (const key of preferredKeys) {
    const value = record[key];
    const parsed = extractFirstNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  for (const value of Object.values(record)) {
    const parsed = extractFirstNumber(value);
    if (parsed !== null) {
      return parsed;
    }
  }

  return null;
}

function formatLastUpdate(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString(undefined, {
    year: '2-digit',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function parseLastUpdateRows(payload: unknown): LastUpdateRow[] {
  const rows: LastUpdateRow[] = [];
  const seenKeys = new Set<string>();
  const visited = new WeakSet<object>();
  const nonSensorIdKeys = new Set([
    'last_update',
    'lastupdate',
    'updated_at',
    'updatedat',
    'timestamp',
    'date',
    'datetime',
    'time',
    'type',
    'name',
    'location',
  ]);

  const isLikelySensorId = (value: string) => {
    const normalized = value.toLowerCase();
    if (nonSensorIdKeys.has(normalized)) {
      return false;
    }

    if (!/^[A-Za-z0-9_-]{4,}$/.test(value)) {
      return false;
    }

    return /\d/.test(value);
  };

  const getUpdateValue = (entry: Record<string, unknown>) =>
    entry.last_update ??
    entry.lastUpdate ??
    entry.updated_at ??
    entry.updatedAt ??
    entry.timestamp ??
    entry.date ??
    entry.datetime;

  const addRow = (sensorId: unknown, lastUpdate: unknown) => {
    const id = typeof sensorId === 'string' || typeof sensorId === 'number' ? String(sensorId) : '';
    const update =
      typeof lastUpdate === 'string' || typeof lastUpdate === 'number'
        ? String(lastUpdate)
        : '';

    if (!id || !update) {
      return;
    }

    const key = `${id}|${update}`;
    if (seenKeys.has(key)) {
      return;
    }

    seenKeys.add(key);
    rows.push({ sensorId: id, lastUpdate: update });
  };

  const visit = (node: unknown, parentKey?: string) => {
    if (Array.isArray(node)) {
      node.forEach((item) => visit(item, parentKey));
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    if (visited.has(node)) {
      return;
    }
    visited.add(node);

    const record = node as Record<string, unknown>;
    const sensorId = record.id ?? record.sensor_id ?? record.sensorId ?? record.sensor;
    const lastUpdate = getUpdateValue(record);

    if (sensorId !== undefined && lastUpdate !== undefined) {
      addRow(sensorId, lastUpdate);
    } else if (parentKey && isLikelySensorId(parentKey) && lastUpdate !== undefined) {
      addRow(parentKey, lastUpdate);
    }

    for (const [key, value] of Object.entries(record)) {
      if ((typeof value === 'string' || typeof value === 'number') && isLikelySensorId(key)) {
        addRow(key, value);
        continue;
      }

      visit(value, key);
    }
  };

  visit(payload);
  return rows;
}

export default function StatisticsScreen() {
  const { t } = useLanguage();
  const [rows, setRows] = useState<LastUpdateRow[]>([]);
  const [totalSensors, setTotalSensors] = useState<number | null>(null);
  const [totalMeasurements, setTotalMeasurements] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metricModalVisible, setMetricModalVisible] = useState(false);
  const [selectedSensorId, setSelectedSensorId] = useState<string | null>(null);
  const [metricRows, setMetricRows] = useState<MetricRow[]>([]);
  const [metricLoading, setMetricLoading] = useState(false);
  const [metricError, setMetricError] = useState<string | null>(null);

  const createApiClient = () => {
    const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    const tokenUrl = process.env.EXPO_PUBLIC_OAUTH_TOKEN_URL;
    const clientId = process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID;
    const clientSecret = process.env.EXPO_PUBLIC_OAUTH_CLIENT_SECRET;
    const scope = process.env.EXPO_PUBLIC_OAUTH_SCOPE;

    if (!baseUrl || !tokenUrl || !clientId || !clientSecret) {
      throw new Error(
        'Missing env vars. Set EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_OAUTH_TOKEN_URL, EXPO_PUBLIC_OAUTH_CLIENT_ID, EXPO_PUBLIC_OAUTH_CLIENT_SECRET.'
      );
    }

    return new APIDataReader({
      baseUrl,
      oauth: {
        tokenUrl,
        clientId,
        clientSecret,
        scope,
      },
    });
  };

  const getApiData = async () => {
    try {
      setLoading(true);
      setError(null);

      const api = createApiClient();

      const [lastUpdatesResult, totalSensorsResult, totalMeasurementsResult] = await Promise.allSettled([
        api.get<unknown>('/sensors/last_updates/'),
        api.get<unknown>('/trees/site/sensors/num%20sensors'),
        api.get<unknown>('/trees/dashboard/stats'),
      ]);

      if (lastUpdatesResult.status === 'fulfilled') {
        setRows(parseLastUpdateRows(lastUpdatesResult.value));
      } else {
        setRows([]);
      }

      if (totalSensorsResult.status === 'fulfilled') {
        const count = extractFirstNumber(totalSensorsResult.value, [
          'num_sensors',
          'numSensors',
          'total_sensors',
          'totalSensors',
          'count',
        ]);
        setTotalSensors(count);
      } else {
        setTotalSensors(null);
      }

      if (totalMeasurementsResult.status === 'fulfilled') {
        const count = extractFirstNumber(totalMeasurementsResult.value, [
          'measurements',
          'total_measurements',
          'totalMeasurements',
          'n_measurements',
          'count',
        ]);
        setTotalMeasurements(count);
      } else {
        setTotalMeasurements(null);
      }

      if (
        lastUpdatesResult.status === 'rejected' &&
        totalSensorsResult.status === 'rejected' &&
        totalMeasurementsResult.status === 'rejected'
      ) {
        throw new Error('Failed to load statistics endpoints.');
      }
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load last updates.';
      setRows([]);
      setTotalSensors(null);
      setTotalMeasurements(null);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const openMetricModal = async (sensorId: string) => {
    setSelectedSensorId(sensorId);
    setMetricModalVisible(true);
    setMetricLoading(true);
    setMetricError(null);
    setMetricRows([]);

    try {
      const api = createApiClient();
      const metricResponse = await api.get<unknown>(`/trees/${encodeURIComponent(sensorId)}/metric`);
      setMetricRows(parseMetricRows(metricResponse));
    } catch (fetchError) {
      setMetricRows([]);
      setMetricError(fetchError instanceof Error ? fetchError.message : 'Failed to load metric data.');
    } finally {
      setMetricLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      getApiData();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Statistics</Text>
      <Text style={styles.summaryTitle}>
        Sensors: {totalSensors ?? '—'}   |   Measurements: {totalMeasurements ?? '—'}
      </Text>

      <View style={styles.panel}>
        {loading ? <ActivityIndicator size="small" color="#003049" /> : null}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!loading && !error ? (
          <ScrollView style={styles.resultScroll} contentContainerStyle={styles.resultContent}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.cellText, styles.headerText, styles.sensorCell]}>Sensor ID</Text>
              <Text style={[styles.cellText, styles.headerText, styles.updateCell]}>Last update</Text>
            </View>

            {rows.length > 0 ? (
              rows.map((row, index) => (
                <View key={`${row.sensorId}-${index}`} style={styles.tableRow}>
                  <Pressable
                    onPress={() => openMetricModal(row.sensorId)}
                    style={({ pressed }) => [styles.sensorCell, pressed && styles.sensorCellPressed]}
                    accessibilityLabel={`Open metrics for sensor ${row.sensorId}`}
                  >
                    <Text style={[styles.cellText, styles.sensorCellText]}>{row.sensorId}</Text>
                  </Pressable>
                  <Text style={[styles.cellText, styles.updateCell]}>{formatLastUpdate(row.lastUpdate)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No sensor updates available.</Text>
            )}
          </ScrollView>
        ) : null}
      </View>

      <Modal
        visible={metricModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setMetricModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Sensor metric: {selectedSensorId ?? '—'}</Text>
              <Pressable onPress={() => setMetricModalVisible(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </Pressable>
            </View>

            {metricLoading ? <ActivityIndicator size="small" color="#003049" /> : null}
            {metricError ? <Text style={styles.errorText}>{metricError}</Text> : null}

            {!metricLoading && !metricError ? (
              <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.cellText, styles.headerText, styles.metricNameCell]}>Metric</Text>
                  <Text style={[styles.cellText, styles.headerText, styles.metricValueCell]}>Value</Text>
                </View>

                {metricRows.length > 0 ? (
                  metricRows.map((row, index) => (
                    <View key={`${row.metric}-${index}`} style={styles.tableRow}>
                      <Text style={[styles.cellText, styles.metricNameCell]}>{row.metric}</Text>
                      <Text style={[styles.cellText, styles.metricValueCell]}>{row.value}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No metric data available.</Text>
                )}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f9',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    color: '#003049',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
    textAlign: 'center',
  },
  summaryTitle: {
    color: '#23424d',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  panel: {
    flex: 1,
    width: '100%',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dce7eb',
    justifyContent: 'flex-start',
  },
  resultScroll: {
    width: '100%',
    flex: 1,
  },
  resultContent: {
    paddingBottom: 8,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    marginBottom: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sensorCell: {
    flex: 1,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  sensorCellPressed: {
    opacity: 0.75,
  },
  sensorCellText: {
    color: '#1d4ed8',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  updateCell: {
    flex: 2,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  cellText: {
    color: '#1f2937',
    fontSize: 12,
  },
  headerText: {
    fontWeight: '700',
    color: '#003049',
  },
  emptyText: {
    color: '#49636d',
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: '#9d0208',
    fontSize: 13,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 760,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#dce7eb',
    padding: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  modalTitle: {
    color: '#003049',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#003049',
  },
  modalCloseButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    paddingBottom: 8,
  },
  metricNameCell: {
    flex: 1,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  metricValueCell: {
    flex: 1,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
});
