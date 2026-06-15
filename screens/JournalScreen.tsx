import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  mediaUri?: string;
  mediaType?: 'image' | 'video';
};

const INITIAL_ENTRIES: JournalEntry[] = [
  {
    id: '1',
    title: 'Kickoff note',
    content: 'ARCA app setup is complete. Next step is collecting first field observations.',
    createdAt: new Date('2026-06-10T09:15:00'),
  },
  {
    id: '2',
    title: 'Weather check',
    content: 'Observed stronger wind in the coastal area. Added a marker and shared updates with the team.',
    createdAt: new Date('2026-06-11T16:40:00'),
  },
];

export default function JournalScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>(INITIAL_ENTRIES);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  };

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [entries]
  );

  const createJournalEntry = () => {
    const trimmedTitle = title.trim();
    const trimmedContent = content.trim();

    if (!trimmedTitle || !trimmedContent) {
      setError('Please enter both a title and description.');
      return;
    }

    const newEntry: JournalEntry = {
      id: `${Date.now()}`,
      title: trimmedTitle,
      content: trimmedContent,
      createdAt: new Date(),
      mediaUri: mediaUri ?? undefined,
      mediaType: mediaType ?? undefined,
    };

    setEntries((prevEntries) => [newEntry, ...prevEntries]);
    setTitle('');
    setContent('');
    setMediaUri(null);
    setMediaType(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Journal</Text>
      <Text style={styles.description}>Create and track your ARCA field notes.</Text>

      <View style={styles.formCard}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Entry title"
          style={styles.input}
          placeholderTextColor="#8aa0a8"
        />

        <Text style={styles.inputLabel}>Description</Text>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write your observation..."
          multiline
          textAlignVertical="top"
          style={[styles.input, styles.multilineInput]}
          placeholderTextColor="#8aa0a8"
        />

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.formActions}>
          <Pressable
            onPress={createJournalEntry}
            accessibilityLabel="Create journal entry"
            style={({ pressed }) => [styles.createButton, pressed && styles.createButtonPressed]}
          >
            <Text style={styles.createButtonText}>Create Entry</Text>
          </Pressable>

          <Pressable
            onPress={pickMedia}
            accessibilityLabel="Add photo or video"
            style={({ pressed }) => [styles.mediaButton, pressed && styles.mediaButtonPressed]}
          >
            {mediaUri ? (
              <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
            ) : (
              <Ionicons name="add" size={20} color="#ffffff" />
            )}
          </Pressable>
        </View>

        {mediaUri ? (
          <View style={styles.mediaPreview}>
            {mediaType === 'image' ? (
              <Image source={{ uri: mediaUri }} style={styles.mediaPreviewImage} resizeMode="cover" />
            ) : (
              <View style={styles.mediaPreviewVideo}>
                <Ionicons name="videocam" size={28} color="#003049" />
                <Text style={styles.mediaPreviewVideoText}>Video selected</Text>
              </View>
            )}
            <Pressable
              onPress={() => { setMediaUri(null); setMediaType(null); }}
              style={styles.mediaRemoveButton}
            >
              <Ionicons name="close-circle" size={20} color="#a11d33" />
            </Pressable>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.entriesScroll}
        contentContainerStyle={styles.entriesContent}
        showsVerticalScrollIndicator={false}
      >
        {sortedEntries.map((entry) => (
          <View key={entry.id} style={styles.entryCard}>
            <Text style={styles.entryTitle}>{entry.title}</Text>
            <Text style={styles.entryDate}>{entry.createdAt.toLocaleString()}</Text>
            <Text style={styles.entryText}>{entry.content}</Text>
            {entry.mediaUri && entry.mediaType === 'image' ? (
              <Image source={{ uri: entry.mediaUri }} style={styles.entryMediaImage} resizeMode="cover" />
            ) : null}
            {entry.mediaUri && entry.mediaType === 'video' ? (
              <View style={styles.entryMediaVideo}>
                <Ionicons name="videocam" size={18} color="#003049" />
                <Text style={styles.entryMediaVideoText}>Video attached</Text>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f8f9',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  title: {
    color: '#003049',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: '#49636d',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.08)',
  },
  inputLabel: {
    color: '#003049',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#f7fbfc',
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    color: '#163540',
  },
  multilineInput: {
    minHeight: 90,
  },
  errorText: {
    color: '#a11d33',
    marginBottom: 8,
    fontSize: 12,
  },
  createButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#003049',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonPressed: {
    backgroundColor: '#004f73',
    opacity: 0.9,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#2a9d8f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaButtonPressed: {
    backgroundColor: '#21867a',
    opacity: 0.9,
  },
  mediaPreview: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.15)',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: 140,
    borderRadius: 8,
  },
  mediaPreviewVideo: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eaf1f3',
    borderRadius: 8,
  },
  mediaPreviewVideoText: {
    color: '#003049',
    fontSize: 13,
    fontWeight: '600',
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
  },
  entryMediaImage: {
    marginTop: 8,
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  entryMediaVideo: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eaf1f3',
    padding: 8,
    borderRadius: 8,
  },
  entryMediaVideoText: {
    color: '#003049',
    fontSize: 12,
    fontWeight: '600',
  },
  entriesScroll: {
    flex: 1,
    marginTop: 14,
  },
  entriesContent: {
    paddingBottom: 24,
    gap: 10,
  },
  entryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,48,73,0.08)',
  },
  entryTitle: {
    color: '#003049',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  entryDate: {
    color: '#5f7a83',
    fontSize: 12,
    marginBottom: 8,
  },
  entryText: {
    color: '#23424d',
    fontSize: 14,
    lineHeight: 20,
  },
});
