const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const dataStore = new Map(); // Simulación de KV Namespace

app.post('/api/update-usage', (req, res) => {
  try {
    const { url: bodyUrl, p100, getlinked, irev } = req.body;
    if (!bodyUrl || typeof p100 !== "number" || typeof getlinked !== "number" || typeof irev !== "number") {
      return res.status(400).json({ message: "Datos incorrectos" });
    }
    if (p100 + getlinked + irev !== 100) {
      return res.status(400).json({ message: "Los porcentajes deben sumar 100%" });
    }
    storeData(bodyUrl, { p100, getlinked, irev });
    return res.status(200).json({ message: "Datos almacenados correctamente" });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

app.get('/api/get-usage', (req, res) => {
  try {
    const urlToRetrieve = req.query.url;
    if (!urlToRetrieve) {
      return res.status(400).json({ message: "Parámetro URL faltante" });
    }
    const data = getData(urlToRetrieve);
    if (!data) {
      return res.status(404).json({ message: "No se encontraron datos para la URL proporcionada" });
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

app.get('/api/list-urls', (req, res) => {
  try {
    const data = listData();
    return res.status(200).json(data);
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    return res.status(500).json({ message: "Error al procesar la solicitud" });
  }
});

function storeData(url, data) {
  try {
    const existingData = dataStore.get(url) || {};
    const updatedData = { ...existingData, ...data };
    dataStore.set(url, updatedData);
  } catch (error) {
    console.error("Error al almacenar los datos:", error);
    throw new Error("Error al almacenar los datos");
  }
}

function getData(url) {
  try {
    return dataStore.get(url) || null;
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    throw new Error("Error al obtener los datos");
  }
}

function listData() {
  try {
    const data = {};
    dataStore.forEach((value, key) => {
      data[key] = value;
    });
    return data;
  } catch (error) {
    console.error("Error al listar los datos:", error);
    throw new Error("Error al listar los datos");
  }
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});