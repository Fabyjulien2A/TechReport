import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// --- Typage global ---
export type Report = {
  id?: number | string;
  nom: string;
  prenom: string;
  client?: string;
  travaux: string;
  heures: number;
  minutes: number;
  date: string;
};

const STORAGE_KEY = "cr_items_v4";

const getApiBaseUrl = () => {
  return "http://192.168.1.45:8000/api";
};

export default function Home() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [client, setClient] = useState("");
  const [travaux, setTravaux] = useState("");
  const [heures, setHeures] = useState("");
  const [minutes, setMinutes] = useState("");
  const [items, setItems] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterToday, setFilterToday] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    if (!loading) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch((e) =>
        console.warn("Save error:", e)
      );
    }
  }, [items, loading]);

  const addItem = async () => {
    const newItem: Report = {
      nom: nom.trim(),
      prenom: prenom.trim(),
      client: client.trim(),
      travaux: travaux.trim(),
      heures: parseInt(heures) || 0,
      minutes: parseInt(minutes) || 0,
      date: new Date().toISOString().slice(0, 19).replace("T", " "),
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(newItem),
      });

      const text = await response.text();
      if (!response.ok) throw new Error("Erreur API: " + response.status + " " + text);

      const savedItem = JSON.parse(text) as Report;
      setItems((prev) => [{ ...savedItem, id: String(savedItem.id ?? Date.now()) }, ...prev]);

      setNom(""); setPrenom(""); setClient(""); setTravaux(""); setHeures(""); setMinutes("");
    } catch (err) {
      console.error("API error:", err);
      Alert.alert("Erreur", "Impossible d’envoyer le rapport à l’API");
    }
  };

  const deleteItem = (id: string) => {
    Alert.alert("Supprimer ?", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await fetch(`${getApiBaseUrl()}/reports/${id}`, { method: "DELETE" });
            if (!response.ok) throw new Error("Erreur API: " + response.status);
            setItems((prev) => prev.filter((x) => x.id !== id));
          } catch {
            setItems((prev) => prev.filter((x) => x.id !== id));
          }
        },
      },
    ]);
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getApiBaseUrl()}/reports`);
      if (!response.ok) throw new Error("Erreur API: " + response.status);
      const data = (await response.json()) as Report[];
      setItems(data.map((r) => ({ ...r, id: String(r.id) })));
    } catch {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } finally {
      setLoading(false);
    }
  };

  const visibleItems = useMemo(
    () => (filterToday ? items.filter((it) => new Date(it.date).toDateString() === new Date().toDateString()) : items),
    [items, filterToday]
  );

  const totalTime = useMemo(() => {
    const total = visibleItems.reduce((acc, it) => acc + it.heures * 60 + it.minutes, 0);
    return { hh: Math.floor(total / 60), mm: total % 60 };
  }, [visibleItems]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.container}>
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Compte-rendu d’intervention</Text>

            <TextInput style={s.input} placeholder="Nom" value={nom} onChangeText={setNom} />
            <TextInput style={s.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} />
            <TextInput style={s.input} placeholder="Client (optionnel)" value={client} onChangeText={setClient} />
            <TextInput style={[s.input, { height: 90 }]} placeholder="Travaux effectués" value={travaux} onChangeText={setTravaux} multiline />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Heures" value={heures} onChangeText={setHeures} keyboardType="numeric" />
              <TextInput style={[s.input, { flex: 1 }]} placeholder="Minutes" value={minutes} onChangeText={setMinutes} keyboardType="numeric" />
            </View>

            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={addItem}>
                <Text style={s.btnTxt}>Ajouter</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btnOutline, { flex: 1 }]}>
                <Text style={s.btnOutlineTxt}>Exporter CSV (vue)</Text>
              </TouchableOpacity>
            </View>

            <Text style={s.subtitle}>Comptes-rendus ({filterToday ? "aujourd’hui" : "tous"})</Text>

            <View style={s.totalBox}>
              <Text style={s.totalText}>Total : {totalTime.hh} h {totalTime.mm} min</Text>
            </View>

            {loading ? (
              <Text style={{ color: "#666" }}>Chargement…</Text>
            ) : (
              <FlatList
                data={visibleItems}
                keyExtractor={(it) => String(it.id)}
                renderItem={({ item }) => (
                  <View style={s.card}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={s.cardTitle}>{item.nom} {item.prenom}</Text>
                        {item.client ? <Text style={s.cardClient}>Client : {item.client}</Text> : null}
                        <Text style={s.cardDate}>{item.date}</Text>
                      </View>
                      <TouchableOpacity onPress={() => deleteItem(String(item.id))} style={s.trash}>
                        <Text style={{ color: "#fff" }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                    <Text>{item.travaux}</Text>
                    <Text style={{ marginTop: 4 }}>⏱ {item.heures} h {item.minutes} min</Text>
                  </View>
                )}
              />
            )}
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16, 
    backgroundColor: "#E3F2FD" // 👈 Dégradé simulé (clair, on peut remplacer par LinearGradient si tu veux un vrai)
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 12, color: "#7E57C2" }, // violet
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 6, color: "#26C6DA" }, // turquoise
  input: { 
    borderWidth: 1, 
    borderColor: "#ddd", 
    borderRadius: 10, 
    padding: 12, 
    marginBottom: 10, 
    backgroundColor: "#fff" // 👈 champs sur fond blanc
  },
  btn: { backgroundColor: "#7E57C2", padding: 14, borderRadius: 10, alignItems: "center" }, // violet
  btnTxt: { color: "#fff", fontWeight: "700" },
  btnOutline: { borderWidth: 1, borderColor: "#26C6DA", padding: 14, borderRadius: 10, alignItems: "center" }, // turquoise
  btnOutlineTxt: { color: "#26C6DA", fontWeight: "700" },
  card: { 
    padding: 14, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    marginBottom: 12, 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowOffset: { width: 0, height: 2 }, 
    shadowRadius: 4, 
    elevation: 2 // 👈 ombre Android
  },
  cardTitle: { fontWeight: "700", fontSize: 16, color: "#7E57C2" }, // violet
  cardClient: { color: "#26C6DA", marginTop: 2, marginBottom: 2, fontSize: 13 }, // turquoise
  cardDate: { color: "#757575", marginBottom: 6, fontSize: 12 },
  trash: { backgroundColor: "#ef4444", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
  totalBox: { backgroundColor: "#ede7f6", padding: 10, borderRadius: 10, marginBottom: 10, marginTop: 6 }, // violet clair
  totalText: { fontWeight: "700", color: "#7E57C2" },
});
