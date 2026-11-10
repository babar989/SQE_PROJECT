/**
 * ============================================================
 *  Food Item API: CRUD REST API (Node.js + Express + MongoDB)
 *  Tested with Postman (API integration testing)
 * ============================================================
 *  SETUP (empty folder containing this file):
 *    npm init -y
 *    npm install express mongoose
 *    node server.js
 *  Optional Atlas: set MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/fooddb
 *
 *  BASE URL: http://localhost:3000/api/foods
 *
 *  ENDPOINTS
 *    POST   /api/foods        -> 201 (400 invalid, 409 duplicate name)
 *    GET    /api/foods        -> 200 (optional filters: ?category=Dessert&maxPrice=500)
 *    GET    /api/foods/:id    -> 200 (400 bad id, 404 not found)
 *    PUT    /api/foods/:id    -> 200 (400, 404, 409)
 *    DELETE /api/foods/:id    -> 200 (400, 404)
 *
 *  SAMPLE BODY
 *    { "name": "Chicken Biryani", "category": "Main Course",
 *      "price": 350, "stock": 40, "isVegetarian": false }
 *    category: Fast Food | Main Course | Dessert | Beverage | Snack
 * ============================================================
 */
const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fooddb';
const PORT = process.env.PORT || 3000;

// ---------------- Schema & Model ----------------
const CATEGORIES = ['Fast Food', 'Main Course', 'Dessert', 'Beverage', 'Snack'];

const foodSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    category: { type: String, required: true, enum: CATEGORIES },
    price: { type: Number, required: true, min: 1 },
    stock: { type: Number, required: true, min: 0, default: 0 },
    isVegetarian: { type: Boolean, required: true },
  },
  { versionKey: false }
);
const Food = mongoose.model('Food', foodSchema);

// ---------------- Helpers ----------------
function validate(b) {
  const errors = [];
  const { name, category, price, stock, isVegetarian } = b || {};
  if (typeof name !== 'string' || !name.trim()) errors.push('name is required (non-empty string)');
  if (!CATEGORIES.includes(category)) errors.push(`category must be one of: ${CATEGORIES.join(', ')}`);
  if (typeof price !== 'number' || !(price >= 1)) errors.push('price is required (number >= 1)');
  if (!Number.isInteger(stock) || stock < 0) errors.push('stock is required (integer >= 0)');
  if (typeof isVegetarian !== 'boolean') errors.push('isVegetarian is required (true or false)');
  return errors;
}
const validId = (id) => mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
const pick = ({ name, category, price, stock, isVegetarian }) => ({ name, category, price, stock, isVegetarian });

// ---------------- Routes ----------------
app.post('/api/foods', async (req, res) => {
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  try {
    res.status(201).json(await Food.create(pick(req.body)));
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'A food item with this name already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/foods', async (req, res) => {
  try {
    const filter = {};
    if (req.query.category) {
      if (!CATEGORIES.includes(req.query.category))
        return res.status(400).json({ error: `category must be one of: ${CATEGORIES.join(', ')}` });
      filter.category = req.query.category;
    }
    if (req.query.maxPrice !== undefined) {
      const mp = Number(req.query.maxPrice);
      if (Number.isNaN(mp)) return res.status(400).json({ error: 'maxPrice must be a number' });
      filter.price = { $lte: mp };
    }
    res.status(200).json(await Food.find(filter));
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/foods/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    const doc = await Food.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Food item not found' });
    res.status(200).json(doc);
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/foods/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  const errors = validate(req.body);
  if (errors.length) return res.status(400).json({ error: 'Validation failed', details: errors });
  try {
    const updated = await Food.findByIdAndUpdate(req.params.id, pick(req.body), {
      returnDocument: 'after',
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: 'Food item not found' });
    res.status(200).json(updated);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: 'A food item with this name already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/foods/:id', async (req, res) => {
  if (!validId(req.params.id)) return res.status(400).json({ error: 'Invalid ID format' });
  try {
    const deleted = await Food.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Food item not found' });
    res.status(200).json({ message: 'Food item deleted successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON body' });
  res.status(500).json({ error: 'Internal server error' });
});

// ---------------- Start ----------------
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    await Food.init(); // ensure unique index on name
    console.log('MongoDB connected');
    app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}/api/foods`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
