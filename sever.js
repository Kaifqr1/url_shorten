const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
const PORT = 3010;

app.use(express.json());
app.use(cors());

mongoose
    .connect('mongodb://127.0.0.1:27017/urlshortener', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

const urlSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    longUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

const Url = mongoose.model('Url', urlSchema);

app.post('/shorten', async (req, res) => {
    const { longUrl } = req.body;

    if (!longUrl || !isValidUrl(longUrl)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }

    try {
        const shortId = nanoid(6);
        const newUrl = new Url({ shortId, longUrl });
        await newUrl.save();

        const shortUrl = `${req.protocol}://${req.get('host')}/${shortId}`;
        res.json({ shortUrl });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.get('/:shortId', async (req, res) => {
    const { shortId } = req.params;

    try {
        const urlEntry = await Url.findOne({ shortId });
        if (urlEntry) {
            return res.redirect(urlEntry.longUrl);
        }
        res.status(404).json({ error: 'Short URL not found' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (err) {
        return false;
    }
}

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
