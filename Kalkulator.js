const layar = document.getElementById("layar");

let angkaPertama = null;
let operator = null;
let mulaiAngkaBaru = true;

function masukAngka(angka) {
    if (mulaiAngkaBaru) {
        layar.value = angka === "." ? "0." : angka;
        mulaiAngkaBaru = false;
        return;
    }

    if (angka === "." && layar.value.includes(".")) {
        return;
    }

    layar.value += angka;
}

function pilihOperator(op) {
    angkaPertama = Number(layar.value);
    operator = op;
    mulaiAngkaBaru = true;
    }

function hitung() {
    if (operator === null || mulaiAngkaBaru) {
        return;
    }

    const angkaKedua = Number(layar.value);
    let hasil;

    switch (operator) {
        case "+":
            hasil = angkaPertama + angkaKedua;
            break;

        case "-":
            hasil = angkaPertama - angkaKedua;
            break;

        case "*":
            hasil = angkaPertama * angkaKedua;
            break;

        case "/":
            if (angkaKedua === 0) {
                layar.value = "Tidak bisa";
                operator = null;
                mulaiAngkaBaru = true;
                return;
            }

            hasil = angkaPertama / angkaKedua;
            break;
    }

    layar.value = String(Number(hasil.toPrecision(10)));
    operator = null;
    mulaiAngkaBaru = true;
}

function hapus() {
    layar.value = "0";
    angkaPertama = null;
    operator = null;
    mulaiAngkaBaru = true;
} 

function hapusSatu() {
    if (mulaiAngkaBaru) {
        return;
    }

    if (layar.value.length <= 1 ||
        (layar.value.length === 2 && layar.value.startsWith("-"))) {
        layar.value = "0";
        mulaiAngkaBaru = true;    
    } else {
        layar.value = layar.value.slice(0, -1);
    }
}


const jumlahBintang = 100;

const wadahBintang = document.createElement("div");
wadahBintang.className = "stars";
document.body.appendChild(wadahBintang);

for (let i = 0; i < jumlahBintang; i++) {
    const bintang = document.createElement("span");
    bintang.className = "star";

    const ukuran = Math.random() * 2 + 0.5;
    const durasiGerak = Math.random() * 40 + 30;
    const durasiKedip = Math.random() * 3 + 2;

    bintang.style.left = Math.random() * 100 + "%";
    bintang.style.top = Math.random() * 100 + "%";
    bintang.style.width = ukuran + "px";
    bintang.style.height = ukuran + "px";

    bintang.style.animationDuration =
        durasiGerak + "s, " + durasiKedip + "s";

    bintang.style.animationDelay =
        -Math.random() * durasiGerak + "s, -" +
        Math.random() * durasiKedip + "s";

    wadahBintang.appendChild(bintang);
}


function buatBintangJatuh() {
    const bintangJatuh = document.createElement("span");
    bintangJatuh.className = "shooting-star";

    bintangJatuh.style.left = Math.random() * 100 + "%";
    bintangJatuh.style.top = Math.random() * 60 + "%";

    document.body.appendChild(bintangJatuh);

    setTimeout(() => {
        bintangJatuh.remove();
    }, 1300);
}

// Muncul secara acak setiap 3–8 detik
function jadwalkanBintang() {
    const jeda = Math.random() * 5000 + 3000;

    setTimeout(() => {
        buatBintangJatuh();
        jadwalkanBintang();
    }, jeda);
}

jadwalkanBintang();

