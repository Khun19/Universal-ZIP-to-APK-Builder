import React, {useMemo, useState} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';

const communities = [
  {id: 'orbit', name: 'Orbit Community', initials: 'OC', color: '#5865f2', channels: ['general', 'introductions', 'showcase']},
  {id: 'studio', name: 'Design Studio', initials: 'DS', color: '#e879f9', channels: ['design-chat', 'feedback', 'resources']},
  {id: 'mobile', name: 'Mobile Builders', initials: 'MB', color: '#22c55e', channels: ['react-native', 'android-help', 'releases']},
];

const initialMessages = [
  {id: '1', author: 'Mika', time: '09:41', text: 'Welcome in! Share what you are building today.'},
  {id: '2', author: 'Arun', time: '09:43', text: 'Testing a React Native app directly from a ZIP.'},
  {id: '3', author: 'Nora', time: '09:45', text: 'Nice. Keep the first build small and verify every tap.'},
];

function ActionButton({label, onPress, secondary = false}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.actionButton, secondary && styles.secondaryButton]}>
      <Text style={[styles.actionText, secondary && styles.secondaryActionText]}>{label}</Text>
    </Pressable>
  );
}

export default function App() {
  const [screen, setScreen] = useState('Communities');
  const [communityId, setCommunityId] = useState('orbit');
  const [channel, setChannel] = useState('general');
  const [messagesByChannel, setMessagesByChannel] = useState({'orbit:general': initialMessages});
  const [draft, setDraft] = useState('');
  const [tapCount, setTapCount] = useState(0);

  const community = communities.find(item => item.id === communityId) || communities[0];
  const channelKey = communityId + ':' + channel;
  const messages = messagesByChannel[channelKey] || initialMessages;
  const memberCount = useMemo(() => communityId === 'orbit' ? '2,418' : communityId === 'studio' ? '864' : '1,206', [communityId]);

  function openCommunity(item) {
    setCommunityId(item.id);
    setChannel(item.channels[0]);
    setScreen('Chat');
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text) return;
    const nextMessage = {id: String(Date.now()), author: 'You', time: 'now', text};
    setMessagesByChannel(current => ({
      ...current,
      [channelKey]: [...(current[channelKey] || initialMessages), nextMessage],
    }));
    setDraft('');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#111318" />
      <View style={styles.app}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>orbit<Text style={styles.brandDot}>.</Text></Text>
            <Text style={styles.subtitle}>YOUR COMMUNITIES</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Increase interaction counter" onPress={() => setTapCount(value => value + 1)} style={styles.counterPill}>
            <Text style={styles.counterText}>TAPS {tapCount}</Text>
          </Pressable>
        </View>

        {screen === 'Communities' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>YOUR SPACE</Text>
            <Text style={styles.pageTitle}>Communities</Text>
            <Text style={styles.pageDescription}>Find your people. Build something together.</Text>
            {communities.map(item => (
              <Pressable key={item.id} accessibilityRole="button" onPress={() => openCommunity(item)} style={styles.communityCard}>
                <View style={[styles.communityIcon, {backgroundColor: item.color}]}><Text style={styles.communityInitials}>{item.initials}</Text></View>
                <View style={styles.cardMain}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>{item.channels.length} channels · {item.id === 'orbit' ? '2.4k' : item.id === 'studio' ? '864' : '1.2k'} members</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
            <View style={styles.tipCard}>
              <Text style={styles.tipTitle}>Quick interaction check</Text>
              <Text style={styles.tipText}>Tap the counter above, open a community, then send a local message in chat.</Text>
              <ActionButton label="Open Orbit chat" onPress={() => openCommunity(communities[0])} />
            </View>
          </ScrollView>
        )}

        {screen === 'Chat' && (
          <View style={styles.chatLayout}>
            <View style={styles.chatHeader}>
              <View style={[styles.smallCommunityIcon, {backgroundColor: community.color}]}><Text style={styles.smallCommunityInitials}>{community.initials}</Text></View>
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle}>{community.name}</Text>
                <Text style={styles.cardSub}>{memberCount} members online</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.channelRail}>
              {community.channels.map(item => (
                <Pressable key={item} accessibilityRole="button" onPress={() => setChannel(item)} style={[styles.channelChip, item === channel && styles.channelChipActive]}>
                  <Text style={[styles.channelChipText, item === channel && styles.channelChipTextActive]}># {item}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <View style={styles.conversationHeading}>
              <Text style={styles.hashLarge}>#</Text>
              <View>
                <Text style={styles.pageTitle}>{channel}</Text>
                <Text style={styles.pageDescription}>This is the beginning of #{channel}.</Text>
              </View>
            </View>
            <ScrollView style={styles.messages} contentContainerStyle={styles.messageList}>
              {messages.map(message => (
                <View key={message.id} style={styles.messageRow}>
                  <View style={[styles.avatar, message.author === 'You' && styles.youAvatar]}><Text style={styles.avatarText}>{message.author.slice(0, 1).toUpperCase()}</Text></View>
                  <View style={styles.messageBody}>
                    <View style={styles.messageMeta}><Text style={styles.messageAuthor}>{message.author}</Text><Text style={styles.messageTime}>{message.time}</Text></View>
                    <Text style={styles.messageText}>{message.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <View style={styles.composer}>
              <TextInput accessibilityLabel="Write a message" placeholder={'Message # ' + channel} placeholderTextColor="#7e8492" value={draft} onChangeText={setDraft} onSubmitEditing={sendMessage} returnKeyType="send" style={styles.input} />
              <Pressable accessibilityRole="button" accessibilityLabel="Send message" onPress={sendMessage} style={styles.sendButton}><Text style={styles.sendButtonText}>↑</Text></Pressable>
            </View>
          </View>
        )}

        {screen === 'Profile' && (
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.eyebrow}>YOUR ACCOUNT</Text>
            <Text style={styles.pageTitle}>Profile</Text>
            <View style={styles.profileCard}>
              <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>Y</Text></View>
              <Text style={styles.profileName}>Your Demo Profile</Text>
              <Text style={styles.cardSub}>@local-builder · Offline demo</Text>
              <View style={styles.profileDivider} />
              <View style={styles.profileStat}><Text style={styles.profileStatLabel}>Messages sent</Text><Text style={styles.profileStatValue}>{Object.values(messagesByChannel).reduce((sum, list) => sum + list.filter(item => item.author === 'You').length, 0)}</Text></View>
              <View style={styles.profileStat}><Text style={styles.profileStatLabel}>Interactions tested</Text><Text style={styles.profileStatValue}>{tapCount}</Text></View>
            </View>
            <Text style={styles.pageDescription}>All profile and chat data stays on this demo screen. No account or network connection is used.</Text>
            <ActionButton label="Back to communities" onPress={() => setScreen('Communities')} secondary />
          </ScrollView>
        )}

        <View style={styles.bottomNav}>
          {[{name: 'Communities', icon: '◈'}, {name: 'Chat', icon: '▤'}, {name: 'Profile', icon: '○'}].map(item => (
            <Pressable key={item.name} accessibilityRole="button" onPress={() => setScreen(item.name)} style={styles.navItem}>
              <Text style={[styles.navIcon, screen === item.name && styles.navSelected]}>{item.icon}</Text>
              <Text style={[styles.navLabel, screen === item.name && styles.navSelected]}>{item.name}</Text>
              {screen === item.name && <View style={styles.navIndicator} />}
            </Pressable>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#111318'},
  app: {flex: 1, backgroundColor: '#17191f'},
  topBar: {paddingHorizontal: 22, paddingTop: 12, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#2a2d36'},
  brand: {color: '#f5f6fa', fontSize: 28, fontWeight: '900', letterSpacing: -1.2},
  brandDot: {color: '#7c8cff'},
  subtitle: {color: '#858b9a', fontSize: 9, fontWeight: '800', letterSpacing: 2.2, marginTop: 1},
  counterPill: {backgroundColor: '#252a3b', borderColor: '#3c466e', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20},
  counterText: {color: '#aeb9ff', fontSize: 10, fontWeight: '800', letterSpacing: 1},
  content: {padding: 22, paddingBottom: 30},
  eyebrow: {color: '#9ca8ff', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginTop: 5},
  pageTitle: {color: '#f5f6fa', fontSize: 27, fontWeight: '800', marginTop: 7, letterSpacing: -0.6},
  pageDescription: {color: '#969baa', fontSize: 13, lineHeight: 19, marginTop: 5, marginBottom: 18},
  communityCard: {backgroundColor: '#20232b', borderWidth: 1, borderColor: '#2d303a', borderRadius: 17, padding: 14, marginBottom: 11, flexDirection: 'row', alignItems: 'center'},
  communityIcon: {width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center'},
  communityInitials: {color: '#fff', fontWeight: '900', fontSize: 14},
  cardMain: {flex: 1, marginLeft: 13},
  cardTitle: {color: '#f1f2f7', fontSize: 14, fontWeight: '700'},
  cardSub: {color: '#8d93a2', fontSize: 11, marginTop: 5},
  chevron: {color: '#81889b', fontSize: 26, marginLeft: 8},
  tipCard: {backgroundColor: '#20243a', borderRadius: 17, borderWidth: 1, borderColor: '#353b5a', padding: 17, marginTop: 10},
  tipTitle: {color: '#e8eaff', fontSize: 14, fontWeight: '800'},
  tipText: {color: '#a4aac0', fontSize: 12, lineHeight: 18, marginTop: 7, marginBottom: 14},
  actionButton: {backgroundColor: '#6878f7', borderRadius: 11, paddingVertical: 12, alignItems: 'center'},
  actionText: {color: '#fff', fontWeight: '800', fontSize: 12},
  secondaryButton: {backgroundColor: '#252936', borderWidth: 1, borderColor: '#393e4d', marginTop: 14},
  secondaryActionText: {color: '#d7d9e4'},
  chatLayout: {flex: 1},
  chatHeader: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#2a2d36'},
  smallCommunityIcon: {width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  smallCommunityInitials: {color: '#fff', fontWeight: '900', fontSize: 11},
  channelRail: {paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center'},
  channelChip: {backgroundColor: '#232630', borderRadius: 10, borderWidth: 1, borderColor: '#303440', paddingHorizontal: 12, paddingVertical: 9, marginRight: 7},
  channelChipActive: {backgroundColor: '#30385f', borderColor: '#6576e9'},
  channelChipText: {color: '#a0a5b4', fontSize: 11, fontWeight: '600'},
  channelChipTextActive: {color: '#dce1ff'},
  conversationHeading: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2a2d36'},
  hashLarge: {color: '#81889b', fontSize: 31, fontWeight: '300', marginRight: 12},
  messages: {flex: 1},
  messageList: {paddingHorizontal: 16, paddingTop: 18, paddingBottom: 18},
  messageRow: {flexDirection: 'row', marginBottom: 20},
  avatar: {width: 34, height: 34, borderRadius: 12, backgroundColor: '#3e4563', alignItems: 'center', justifyContent: 'center'},
  youAvatar: {backgroundColor: '#3e755f'},
  avatarText: {color: '#fff', fontWeight: '800', fontSize: 13},
  messageBody: {flex: 1, marginLeft: 10},
  messageMeta: {flexDirection: 'row', alignItems: 'center'},
  messageAuthor: {color: '#f0f1f6', fontSize: 12, fontWeight: '800'},
  messageTime: {color: '#727888', fontSize: 10, marginLeft: 8},
  messageText: {color: '#c1c4ce', fontSize: 12, lineHeight: 18, marginTop: 4},
  composer: {flexDirection: 'row', alignItems: 'center', marginHorizontal: 13, marginVertical: 12, paddingLeft: 13, paddingRight: 6, borderWidth: 1, borderColor: '#343844', backgroundColor: '#20232b', borderRadius: 14},
  input: {flex: 1, minHeight: 43, color: '#f4f5fa', fontSize: 12, paddingVertical: 8},
  sendButton: {width: 34, height: 34, borderRadius: 11, backgroundColor: '#6878f7', alignItems: 'center', justifyContent: 'center'},
  sendButtonText: {color: '#fff', fontSize: 20, fontWeight: '800', marginTop: -2},
  profileCard: {backgroundColor: '#20232b', borderRadius: 18, borderWidth: 1, borderColor: '#303440', padding: 22, alignItems: 'center', marginTop: 5, marginBottom: 18},
  profileAvatar: {width: 76, height: 76, borderRadius: 26, backgroundColor: '#6878f7', alignItems: 'center', justifyContent: 'center', marginBottom: 13},
  profileAvatarText: {color: '#fff', fontSize: 29, fontWeight: '900'},
  profileName: {color: '#f5f6fa', fontSize: 17, fontWeight: '800'},
  profileDivider: {height: 1, alignSelf: 'stretch', backgroundColor: '#353844', marginVertical: 19},
  profileStat: {flexDirection: 'row', justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 8},
  profileStatLabel: {color: '#a0a5b4', fontSize: 12},
  profileStatValue: {color: '#f5f6fa', fontSize: 12, fontWeight: '800'},
  bottomNav: {flexDirection: 'row', paddingTop: 9, paddingBottom: 7, backgroundColor: '#111318', borderTopWidth: 1, borderTopColor: '#2a2d36'},
  navItem: {flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 3},
  navIcon: {color: '#777d8c', fontSize: 19, height: 24},
  navLabel: {color: '#777d8c', fontSize: 9, fontWeight: '700', marginTop: 2},
  navSelected: {color: '#aeb8ff'},
  navIndicator: {width: 17, height: 2, borderRadius: 2, backgroundColor: '#7b8aff', marginTop: 5},
});
