const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { kv } = require('@vercel/kv'); // Cliente Vercel KV

const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req, res) => {
  console.log('Hola! mundo'); 
  res.send('Hola! mundo');    
});

// Endpoint para almacenar datos
app.post('/api/store-data', async (req, res) => {
  try {
    const { url, ...values } = req.body;

    // Verificar si se han proporcionado una URL y valores
    if (!url || Object.keys(values).length === 0) {
      return res.status(400).json({ message: 'Faltan parámetros' });
    }

    // Calcular la suma de los valores
    const total = Object.values(values).reduce((sum, value) => sum + value, 0);

    // Validar que la suma de los valores sea 100
    if (total !== 100) {
      return res.status(400).json({ message: 'La suma de los valores debe ser 100%' });
    }

    // Almacenar los datos
    await kv.set(url, values);

    return res.status(200).json({ message: 'Datos almacenados correctamente' });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

// Endpoint para recuperar datos
app.get('/api/get-data', async (req, res) => {
  try {
    // Obtener todas las claves
    const keys = await kv.keys('*');

    // Verificar si hay claves
    if (keys.length === 0) {
      return res.status(200).json({ data: {} });
    }

    // Obtener los valores asociados a las claves
    const values = await Promise.all(keys.map(key => kv.get(key)));

    // Crear un objeto con las claves y sus valores
    const data = keys.reduce((acc, key, index) => {
      acc[key] = values[index];
      return acc;
    }, {});

    return res.status(200).json(data.length != 0 ? data : []);
  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

app.delete('/api/delete-data', async (req, res) => {
  const { keys } = req.body; // Obtener las claves del cuerpo de la solicitud

  if (!Array.isArray(keys)) {
    return res.status(400).json({ message: 'El cuerpo de la solicitud debe contener un array de claves.' });
  }

  try {
    // Verificar si todas las claves existen
    const existingKeys = await Promise.all(keys.map(key => kv.get(key)));
    const notFoundKeys = keys.filter((key, index) => existingKeys[index] === null);

    if (notFoundKeys.length > 0) {
      return res.status(404).json({ message: `Las siguientes claves no fueron encontradas: ${notFoundKeys.join(', ')}` });
    }

    // Eliminar todas las claves usando `del`
    await Promise.all(keys.map(key => kv.del(key)));

    return res.status(200).json({ message: `Claves eliminadas exitosamente: ${keys.join(', ')}` });
  } catch (error) {
    console.error('Error al procesar la solicitud:', error.message);
    return res.status(500).json({ message: `Error al procesar la solicitud: ${error.message}` });
  }
});

// Función para realizar una selección aleatoria ponderada
function weightedRandomSelection(percentages) {
  const total = Object.values(percentages).reduce((acc, val) => acc + val, 0);
  
  // Generar un número aleatorio entre 0 y el total de los pesos
  const random = Math.random() * total;

  let cumulativeSum = 0;

  // Iterar sobre cada clave y acumular su peso
  for (const [key, value] of Object.entries(percentages)) {
    cumulativeSum += value;
    if (random <= cumulativeSum) {
      return key;
    }
  }
}

app.post('/api/get-value', async (req, res) => {
  const { url } = req.body;

  try {
    // Obtener todas las claves
    const keys = await kv.keys('*');

    // Verificar si hay claves
    if (keys.length === 0) {
      return res.status(404).json({ error: 'No hay datos almacenados.' });
    }

    // Obtener los valores asociados a las claves
    const values = await Promise.all(keys.map(key => kv.get(key)));

    // Crear un objeto con las claves y sus valores
    const data = keys.reduce((acc, key, index) => {
      acc[key] = values[index];
      return acc;
    }, {});

    // Verificar si la URL existe en los datos recuperados
    if (!data[url]) {
      return res.status(404).json({ error: 'URL no encontrada en el almacenamiento KV' });
    }

    const percentages = data[url];

    // Verificar que la suma de los porcentajes sea mayor a 0
    const total = Object.values(percentages).reduce((acc, val) => acc + val, 0);
    
    if (total === 0) {
      return res.status(400).json({ error: 'No se puede calcular, todos los valores son cero.' });
    }

    // Realizar la selección aleatoria ponderada
    const selectedKey = weightedRandomSelection(percentages);

    // Devolver la clave seleccionada
    res.json({ selectedapikey: selectedKey });

  } catch (error) {
    console.error('Error al procesar la solicitud:', error);
    return res.status(500).json({ message: 'Error al procesar la solicitud' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Servidor corriendo en http://localhost:${port}");
});