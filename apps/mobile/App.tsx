import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, SafeAreaView } from 'react-native';

export default function App() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.logoBadge}>
                    <Text style={styles.logoText}>GB</Text>
                </View>
                <Text style={styles.brandName}>Gellobit</Text>
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Mobile App Parity</Text>
                <Text style={styles.subtitle}>Coming Soon</Text>
            </View>
            <StatusBar style="auto" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    logoBadge: {
        backgroundColor: '#FFDE59',
        padding: 8,
        borderRadius: 8,
        marginRight: 10,
    },
    logoText: {
        fontWeight: '900',
        fontSize: 18,
    },
    brandName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#1a1a1a',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
    }
});
