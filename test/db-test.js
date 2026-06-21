import { MongoClient } from 'mongodb'; // ou const { MongoClient } = require('mongodb'); si votre projet n'est pas en type: module

const uri = "mongodb+srv://Shetys:q%2Ag%23V%5E8%21DF3%2AB269o29%24%2A%24%24r%23X685K@shetys.hqm13re.mongodb.net/?appName=Shetys";
const client = new MongoClient(uri);

async function run() {
  try {
    console.log("Tentative de connexion...");
    await client.connect();

    // On sélectionne une base 'test' et une collection 'ping'
    const db = client.db("test_db");
    const collection = db.collection("ping");

    // On insère un document de test
    const result = await collection.insertOne({ date: new Date(), message: "Connexion réussie !" });
    console.log(`✅ Succès ! Document inséré avec l'ID : ${result.insertedId}`);

  } catch (err) {
    console.error("❌ Erreur de connexion :", err.message);
  } finally {
    await client.close();
  }
}
run();
