import {ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {Link} from 'expo-router';
import {TOOLS} from '@/utils/constants';

export default function HomeScreen() {
  return (
      <View style={styles.container}>
        {/* Tool Grid */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Toolkit 📦</Text>
            <Text style={styles.subtitle}>你的生活工具集1321321</Text>
          </View>

          <View style={styles.grid}>
            {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool}/>
            ))}
          </View>
          <View style={styles.bottomPadding}/>
        </ScrollView>
      </View>
  );
}

function ToolCard({tool}: { tool: typeof TOOLS[0] }) {
  const cardContent = (
      <TouchableOpacity style={styles.card}>
        <View className='items-center'>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{tool.icon}</Text>
          </View>
          <Text style={styles.cardTitle}>{tool.name}</Text>
          <Text style={styles.cardDescription}>
            {tool.description}
          </Text>
        </View>
      </TouchableOpacity>
  );

  return (
      <Link href={tool.route as any} asChild>
        {cardContent}
      </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E0E5EC',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 28,
    paddingHorizontal: 24,
    backgroundColor: '#E0E5EC',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 8,
    shadowColor: '#A3B1C6',
    shadowOffset: {width: 8, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#4A5568',
    textShadowColor: '#FFFFFF',
    textShadowOffset: {width: 2, height: 2},
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#718096',
    marginTop: 6,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  card: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: '#E0E5EC',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#A3B1C6',
    shadowOffset: {width: 6, height: 6},
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 0,
  },
  cardPressed: {
    shadowColor: '#A3B1C6',
    shadowOffset: {width: 3, height: 3},
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E0E5EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#A3B1C6',
    shadowOffset: {width: 4, height: 4},
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  icon: {
    fontSize: 30,
    textAlignVertical: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4A5568',
    textAlign: 'center',
    marginBottom: 6,
    textShadowColor: '#FFFFFF',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 2,
  },
  cardDescription: {
    fontSize: 11,
    color: '#718096',
    textAlign: 'center',
    fontWeight: '400',
  },
  bottomPadding: {
    height: 30,
  },
});