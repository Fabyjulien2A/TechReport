import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

type CR = {
  id: string;
  nom: string;
  prenom: string;
  client?: string;
  travaux: string;
  heures: string;
  minutes: string;
  date: string;
};

const STORAGE_KEY = "cr_items_v4";

export default function Home() {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [client, setClient] = useState("");
  const [travaux, setTravaux] = useState("");
  const [heures, setHeures] = useState("");   // champ heures
  const [minutes, setMinutes] = useState(""); // champ minutes
  const [items, setItems] = useState<CR[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setItems(JSON.parse(raw));
      } catch (e) {
        console.warn("Load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (loading) return;
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      } catch (e) {
        console.warn("Save error:", e);
      }
    })();
  }, [items, loading]);

  const addItem = () => {
    if (!nom.trim() || !prenom.trim() || !travaux.trim() || (!heures.trim() && !minutes.trim())) {
      Alert.alert("Champs requis", "Nom, prénom, travaux et temps sont obligatoires.");
      return;
    }
    const now = new Date().toLocaleString();
    setItems((prev) => [
      {
        id: Date.now().toString(),
        nom: nom.trim(),
        prenom: prenom.trim(),
        client: client.trim() || undefined,
        travaux: travaux.trim(),
        heures: heures.trim() || "0",
        minutes: minutes.trim() || "0",
        date: now,
      },
      ...prev,
    ]);
    setTravaux("");
    setClient("");
    setHeures("");
    setMinutes("");
  };

  const deleteItem = (id: string) => {
    Alert.alert("Supprimer ?", "Confirmer la suppression de ce compte-rendu ?", [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: () => setItems((prev) => prev.filter((x) => x.id !== id)) },
    ]);
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Compte-rendu d’intervention</Text>

      <TextInput style={s.input} placeholder="Nom" value={nom} onChangeText={setNom} />
      <TextInput style={s.input} placeholder="Prénom" value={prenom} onChangeText={setPrenom} />
      <TextInput style={s.input} placeholder="Client (optionnel)" value={client} onChangeText={setClient} />
      <TextInput
        style={[s.input, { height: 90 }]}
        placeholder="Travaux effectués"
        value={travaux}
        onChangeText={setTravaux}
        multiline
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="Heures"
          value={heures}
          onChangeText={setHeures}
          keyboardType="numeric"
        />
        <TextInput
          style={[s.input, { flex: 1 }]}
          placeholder="Minutes"
          value={minutes}
          onChangeText={setMinutes}
          keyboardType="numeric"
        />
      </View>

      <TouchableOpacity style={s.btn} onPress={addItem}>
        <Text style={s.btnTxt}>Ajouter</Text>
      </TouchableOpacity>

      <Text style={s.subtitle}>Derniers comptes-rendus</Text>
      {loading ? (
        <Text style={{ color: "#666" }}>Chargement…</Text>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={s.cardTitle}>{item.nom} {item.prenom}</Text>
                  {item.client ? <Text style={s.cardClient}>Client : {item.client}</Text> : null}
                  <Text style={s.cardDate}>{item.date}</Text>
                </View>
                <TouchableOpacity onPress={() => deleteItem(item.id)} style={s.trash}>
                  <Text style={{ color: "#fff", fontWeight: "700" }}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text>{item.travaux}</Text>
              <Text style={{ marginTop: 4, fontWeight: "600" }}>
                ⏱ Temps passé : {item.heures} h {item.minutes} min
              </Text>
            </View>
          )}
          ListEmptyComponent={<Text style={{ color: "#666" }}>Aucun compte-rendu pour l’instant.</Text>}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  subtitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 12, marginBottom: 10, backgroundColor: "#fafafa" },
  btn: { backgroundColor: "#111", padding: 14, borderRadius: 10, alignItems: "center" },
  btnTxt: { color: "#fff", fontWeight: "700" },
  card: { padding: 12, backgroundColor: "#f6f6f6", borderRadius: 10, marginBottom: 10 },
  cardTitle: { fontWeight: "700" },
  cardClient: { color: "#0f766e", marginTop: 2, marginBottom: 2, fontSize: 12 },
  cardDate: { color: "#666", marginBottom: 6, fontSize: 12 },
  trash: { backgroundColor: "#ef4444", paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8 },
});
