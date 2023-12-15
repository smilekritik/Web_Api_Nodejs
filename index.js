const express = require('express');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, 'public')));

let cachedAnimeData = null;

const translationMap = {
    'id': 'Ідентифікатор',
    'name': 'Назва',
    'russian': 'Російська назва',
    'kind': 'Тип',
    'score': 'Оцінка',
    'status': 'Статус',
    'episodes': 'Епізоди',
    'aired_on': 'Дата виходу',
    'released_on': 'Дата випуску'
};

app.get('/', async (req, res) => {
    try {
        if (!cachedAnimeData) {
            const response = await axios.get('https://shikimori.me/api/animes?limit=10&order=random');
            cachedAnimeData = response.data;
        }

        let html = '<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Аніме з API</title>';
        
        const styles = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf-8');
        
        html += `<style>${styles}</style></head><body>`;
        html += '<h1>Список випадкових аніме:</h1>';
        html += '<div class="anime-grid">';

        let count = 0;
        cachedAnimeData.forEach(anime => {
            if (count % 5 === 0) {
                if (count > 0) {
                    html += '</div>';
                }
                html += '<div class="anime-row">';
            }
            html += '<div class="anime-card">';
            html += `<a href="https://shikimori.me${anime.url}">`;
            html += `<img class="anime-image" src="https://shikimori.me${anime.image.original}" alt="${anime.russian}">`;
            html += `<div class="anime-title">${anime.russian}</div>`;
            html += '</a>';
            html += `<div class="anime-info"><strong>${translationMap['kind']}:</strong> ${anime.kind}</div>`;
            html += `<div class="anime-info"><strong>${translationMap['score']}:</strong> ${anime.score}</div>`;
            html += `<div class="anime-info"><strong>${translationMap['status']}:</strong> ${anime.status}</div>`;
            html += `<div class="anime-info"><strong>${translationMap['episodes']}:</strong> ${anime.episodes}</div>`;
            html += '</div>';
            count++;
        });

        if (count > 0) {
            html += '</div>';
        }

        html += '<a href="/json"><button>Переглянути в JSON форматі</button></a>';

        html += '</body></html>';

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send('Внутрішня помилка сервера');
    }
});

app.get('/json', async (req, res) => {
    try {
        if (!cachedAnimeData) {
            return res.status(400).json({ error: 'Сторінка не завантажена. Будь ласка, відвідайте головну сторінку.' });
        }

        const translatedData = cachedAnimeData.map(anime => {
            const translatedAnime = {};
            for (const key in anime) {
                if (translationMap[key]) {
                    translatedAnime[translationMap[key]] = anime[key];
                } else {
                    translatedAnime[key] = anime[key];
                }
            }
            return translatedAnime;
        });

        res.json(translatedData);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Внутрішня помилка сервера' });
    }
});

app.listen(port, () => {
    console.log(`Сервер працює за адресою http://localhost:${port}\n А відподіть на json за адресою http://localhost:${port}/json`);
});
