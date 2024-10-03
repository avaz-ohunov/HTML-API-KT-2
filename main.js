
'use strict';


// Переменная для хранения текущих координат
let coordinates = null;


// Получение местоположения
document.getElementById('getLocation').addEventListener('click', () => {
    if (navigator.geolocation) {
        navigator.geolocation.getcoordinates((position) => {
            coordinates = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            document.getElementById('locationOutput').innerText = `Широта: ${coordinates.latitude}, Долгота: ${coordinates.longitude}`;
        }, () => {
            alert('Не удалось получить местоположение.');
        });
    } else {
        alert('Геолокация не поддерживается вашим браузером.');
    }
});


// Сохранение в LocalStorage комментария и координат
document.getElementById('localStorageForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const comment = document.getElementById('commentLocalStorage').value;
    if (coordinates && comment) {
        const data = {
            comment,
            position: coordinates
        };
        localStorage.setItem(`locationComment_${Date.now()}`, JSON.stringify(data));
        updateLocalStorageList();
    } else {
        alert('Убедитесь, что определили местоположение и ввели комментарий.');
    }
});


// Обновление LocalStorage
function updateLocalStorageList() {
    const list = document.getElementById('localStorageList');
    list.innerHTML = '';
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('locationComment_')) {
            const data = JSON.parse(localStorage.getItem(key));
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.textContent = `Комментарий: ${data.comment}, Широта: ${data.position.latitude}, Долгота: ${data.position.longitude}`;
            list.appendChild(listItem);
        }
    }
}
updateLocalStorageList();


// Работа с IndexedDB
let db;
const request = indexedDB.open('geoCommentsDB', 1);

request.onerror = function() {
    console.error('Ошибка открытия IndexedDB');
};

request.onsuccess = function() {
    db = request.result;
    updateIndexedDBList();
};

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    const objectStore = db.createObjectStore('comments', { keyPath: 'id', autoIncrement: true });
    objectStore.createIndex('comment', 'comment', { unique: false });
    objectStore.createIndex('position', 'position', { unique: false });
};


// Сохранение в IndexedDB комментария и координат
document.getElementById('indexedDBForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const comment = document.getElementById('commentIndexedDB').value;
    if (coordinates && comment) {
        const transaction = db.transaction(['comments'], 'readwrite');
        const objectStore = transaction.objectStore('comments');
        const data = {
            comment,
            position: coordinates
        };
        objectStore.add(data);
        transaction.oncomplete = function() {
            updateIndexedDBList();
        };
    } else {
        alert('Убедитесь, что определили местоположение и ввели комментарий.');
    }
});


// Обновление IndexedDB
function updateIndexedDBList() {
    const list = document.getElementById('indexedDBList');
    list.innerHTML = '';
    const transaction = db.transaction(['comments'], 'readonly');
    const objectStore = transaction.objectStore('comments');
    objectStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const data = cursor.value;
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item');
            listItem.textContent = `Комментарий: ${data.comment}, Широта: ${data.position.latitude}, Долгота: ${data.position.longitude}`;
            list.appendChild(listItem);
            cursor.continue();
        }
    };
}