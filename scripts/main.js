import { personIcon } from "./constants.js";
import ui from "./ui.js";
import getIcon, { getStatus } from "./helpers.js";
import { homeIcon } from "./constants.js";
import { jobIcon } from "./constants.js";
import { gotoIcon } from "./constants.js";
import { parkIcon } from "./constants.js";

//*Global değişkenler
let map;
//haritadaki tıklanan son konumu tutacağız
let lastClickedCoords;
let layer;
let notes = JSON.parse(localStorage.getItem("notes")) || [];
//console.log(notes);
/**
 * Kullanıcının konumunu öğrenmek için getCurrentPosition() fonksiyonunu kullanıyoruz.
 * 1) Kullanıcı kabul ederse haritayı kullanıcınınn konumuna göre ayarlayacağız 
 * 2) kullanıcı kabul etmezse varsayılan olarak Ankara konumunu belirleyeceğiz.
 
 */
window.navigator.geolocation.getCurrentPosition(
  (e) => {
    loadMap([e.coords.latitude, e.coords.longitude], "Mevcut Konum");
  },
  () => {
    loadMap([39.9334, 32.8597], "Varsayılan Konum");
  }
);

//*Haritayı yükler:
function loadMap(currentPosition, msg) {
  //console.log("mevcut konum", currentPosition);
  //* 1) Harita Kurulum / Merkez belirleme
  map = L.map("map", { zoomControl: false }).setView(currentPosition, 8);
  //sol aşağıya zoom kontrol ekleme
  L.control.zoom({ position: "bottomleft" }).addTo(map);
  //* 2) Haritayı ekrana basar
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 15,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  //*haritanın üzerine imleçleri ekleyebileceğimiz görünmez bir katman oluşturacağız
  layer = L.layerGroup().addTo(map);

  //* 3) Marker ekleme
  L.marker(currentPosition, { icon: personIcon }).addTo(map).bindPopup(msg);
  //* 4) Tıklanma olaylarını izleme
  map.on("click", onMapClick);
  //* 5)Daha önce çağırdığımız notları ekrana bas
  renderNotes();
  renderMarkers();
}
//*Tıklanma olayında çalışacak fonksiyon:
function onMapClick(e) {
  //Tıklanan konumun koordintlarını global değişkene aktar
  lastClickedCoords = [e.latlng.lat, e.latlng.lng];
  //console.log(lastClickedCoords);
  // aside elementine add class`ını ekle
  ui.aside.className = "add";
}
//*iptal butonuna tıklanınca menüyü kapat:
ui.cancelBtn.addEventListener("click", () => {
  //aside elementinden add class`ını kaldır
  ui.aside.className = "";
});
//*Form submit olayını dinleme
ui.form.addEventListener("submit", (e) => {
  //sayfa yenilenmesini engelle
  e.preventDefault();
  //input elemanını seç
  const title = e.target[0].value;
  const date = e.target[1].value;
  const status = e.target[2].value;
  //yeni bir nesne oluştur
  const newNote = {
    id: new Date().getTime(),
    title,
    date,
    status,
    coords: lastClickedCoords,
  };

  //nesneyi global değişkene kaydet
  notes.unshift(newNote);

  //localstorage` a kaydet
  localStorage.setItem("notes", JSON.stringify(notes));

  //aside alanından "add" classını kaldıre
  ui.aside.className = "";

  //formu temizle
  e.target.reset();

  //yeni notun gekrana gelmesi için notları tekrar renderla
  renderNotes();
  //imleçleri ekrana bas
  renderMarkers();
});
//*ekrana imleç bas fonksiyonu
function renderMarkers() {
  //önceki imleçleri sil
  layer.clearLayers();

  notes.forEach((item) => {
    //itemin statüsüne bağlı olarak iconu belirle
    const icon = getIcon(item.status);
    //marker oluştur
    L.marker(item.coords, { icon: icon }) //imleci oluştur
      .addTo(layer) //imleçler katmanına ekle
      .bindPopup(item.title); //imlece bir popup ekle
  });
}

//*Ekrana notları bas
function renderNotes() {
  const noteCard = notes
    .map((item) => {
      //tarihi kullanıcı dostu formata çevir
      const date = new Date(item.date).toLocaleString("tr", {
        day: "2-digit",
        month: "long",
        year: "2-digit",
      });
      //status değerini çevir
      const status = getStatus(item.status);
      //oluşturulacak notun html kodunu belirle
      return `
         <li >
            <div>
              <p>${item.title} </p>
              <p>${date}</p>
              <p>${status} </p>
            </div>
            <div class="icons">
              <i data-id="${item.id}" class="bi bi-airplane-fill" id="fly"></i>
              <i data-id="${item.id}" class="bi bi-trash3-fill" id="delete"></i>
            </div>
          </li>
  `;
    })
    .join("");
  ui.list.innerHTML = noteCard;
  //ekran üzerindeki silme ve uçak butonlarına tıklanınca çalışacak fonksiyonları tanımla
  document.querySelectorAll("li #delete").forEach((btn) => {
    btn.addEventListener("click", () => deleteNote(btn.dataset.id));
  });

  document.querySelectorAll("li #fly").forEach((btn) => {
    btn.addEventListener("click", () => flyToLocation(btn.dataset.id));
  });
}

//*silme butonuna tıklanınca çalışacak fonksiyon
function deleteNote(id) {
  //kullanıcıdan onay al
  const res = confirm("silmek istediğinize emin misiniz?");
  if (res) {
    //id`si eşleşen notu sil
    notes = notes.filter((note) => note.id != id);
    //localstorage`ı güncelle
    localStorage.setItem("notes", JSON.stringify(notes));
    //notları tekrar ekrana bas
    renderNotes();
    //imleçleri tekrar ekrana bas
    renderMarkers();
    console.log(notes, "silindi");
  }
}

//*Uçak butonuna tıklanınca çalışacak fonksiyon
function flyToLocation(id) {
  //id`si eşleşen notu getir
  const note = notes.find((note) => note.id === +id);
  //haritada o notun koordinatlarına git
  map.flyTo(note.coords, 12);
  console.log(notes, "uçuldu");
}
//*Tıklanma olayında
//1) aside elementine hide classını ekle
ui.arrow.addEventListener("click", () => {
  ui.aside.classList.toggle("hide");
});
